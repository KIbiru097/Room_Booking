import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  TransportEventNames,
  TransportBookingCreatedEvent,
  TransportBookingCancelledEvent,
} from '../../events/transport.events';
import type {
  CreateTransportBookingInput,
  SearchTransportServicesInput,
} from '@repo/shared-types';

function generateTransportRef(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++)
    suffix += chars[Math.floor(Math.random() * chars.length)];
  return `YTTR-${year}-${suffix}`;
}

const SERVICE_SELECT = {
  id: true,
  name: true,
  serviceType: true,
  description: true,
  fixedPrice: true,
  currency: true,
  passengerLimit: true,
  luggageLimit: true,
  durationMinutes: true,
  advanceBookingMinutes: true,
  dailyRate: true,
  depositAmount: true,
  mileagePolicyKm: true,
  isActive: true,
  provider: {
    select: {
      id: true,
      businessName: true,
      phone: true,
      email: true,
      description: true,
      verificationStatus: true,
      cityId: true,
      city: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TransportServiceSelect;

@Injectable()
export class TransportationService {
  constructor(
    private readonly db: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  async searchServices(query: SearchTransportServicesInput) {
    const where: Prisma.TransportServiceWhereInput = {
      isActive: true,
      provider: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        deletedAt: null,
      },
    };

    if (query.serviceType) where.serviceType = query.serviceType;
    if (query.passengers) where.passengerLimit = { gte: query.passengers };
    if (query.maxPrice)
      where.fixedPrice = { lte: new Prisma.Decimal(query.maxPrice) };
    if (query.cityId)
      where.provider = { ...(where.provider as object), cityId: query.cityId };

    const skip = (query.page - 1) * query.limit;
    const [total, items] = await Promise.all([
      this.db.transportService.count({ where }),
      this.db.transportService.findMany({
        where,
        select: SERVICE_SELECT,
        skip,
        take: query.limit,
        orderBy: { fixedPrice: 'asc' },
      }),
    ]);

    return { total, page: query.page, limit: query.limit, items };
  }

  async getService(serviceId: string) {
    const service = await this.db.transportService.findUnique({
      where: { id: serviceId },
      select: SERVICE_SELECT,
    });
    if (!service || !service.isActive)
      throw new NotFoundException('Transport service not found');
    return service;
  }

  async createBooking(input: CreateTransportBookingInput, userId: string) {
    // Load and validate service
    const service = await this.db.transportService.findUnique({
      where: { id: input.serviceId },
      include: { provider: true },
    });
    if (!service || !service.isActive) {
      throw new NotFoundException('Transport service not found or inactive');
    }
    if (
      service.provider.status !== 'ACTIVE' ||
      service.provider.verificationStatus !== 'VERIFIED'
    ) {
      throw new BadRequestException('Provider is not active or verified');
    }
    if (input.passengers > service.passengerLimit) {
      throw new BadRequestException(
        `Service supports at most ${service.passengerLimit} passengers`,
      );
    }

    if (
      input.luggageCount != null &&
      service.luggageLimit != null &&
      input.luggageCount > service.luggageLimit
    ) {
      throw new BadRequestException(
        `Service supports at most ${service.luggageLimit} pieces of luggage`,
      );
    }

    const pickupAt = new Date(input.pickupAt);
    const now = new Date();
    if (Number.isNaN(pickupAt.getTime()) || pickupAt <= now) {
      throw new BadRequestException('Pickup time must be a valid future date');
    }
    const advanceMs = service.advanceBookingMinutes * 60 * 1000;

    if (service.serviceType !== 'CAR_RENTAL') {
      if (pickupAt.getTime() - now.getTime() < advanceMs) {
        throw new BadRequestException(
          `Booking must be made at least ${service.advanceBookingMinutes} minutes in advance`,
        );
      }
    }

    // Car rental: require dates and check vehicle overlap
    if (service.serviceType === 'CAR_RENTAL') {
      if (!input.rentalStartDate || !input.rentalEndDate) {
        throw new BadRequestException(
          'Rental start and end dates are required for car rental',
        );
      }
      const start = new Date(input.rentalStartDate);
      const end = new Date(input.rentalEndDate);
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        throw new BadRequestException(
          'Rental end date must be after start date',
        );
      }
    }

    // Linked bookings and trips are private records. Never trust an id from the
    // client without checking that it belongs to the authenticated customer.
    if (input.tripId) {
      const trip = await this.db.trip.findFirst({
        where: { id: input.tripId, userId: userId, deletedAt: null },
        select: { id: true },
      });
      if (!trip)
        throw new ForbiddenException(
          'Trip does not belong to the current customer',
        );
    }
    if (input.hotelBookingId) {
      const hotelBooking = await this.db.booking.findFirst({
        where: { id: input.hotelBookingId, userId },
        select: { id: true },
      });
      if (!hotelBooking)
        throw new ForbiddenException(
          'Hotel booking does not belong to the current customer',
        );
    }

    // Calculate commission
    let price = Number(service.fixedPrice);
    if (service.serviceType === 'CAR_RENTAL') {
      const start = new Date(input.rentalStartDate!);
      const end = new Date(input.rentalEndDate!);
      const rentalDays = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / 86_400_000),
      );
      price = Number(service.dailyRate ?? service.fixedPrice) * rentalDays;
    }
    const commissionRate = 0.15;
    const commissionAmount = Math.round(price * commissionRate * 100) / 100;
    const partnerNetAmount = Math.round((price - commissionAmount) * 100) / 100;

    const bookingRef = generateTransportRef();

    const booking = await this.db.$transaction(async (tx) => {
      const created = await tx.transportBooking.create({
        data: {
          bookingRef,
          userId,
          serviceId: input.serviceId,
          providerId: service.providerId,
          tripId: input.tripId ?? null,
          hotelBookingId: input.hotelBookingId ?? null,
          pickupAt,
          pickupLocation: input.pickupLocation,
          pickupLatitude:
            input.pickupLatitude != null
              ? new Prisma.Decimal(input.pickupLatitude)
              : null,
          pickupLongitude:
            input.pickupLongitude != null
              ? new Prisma.Decimal(input.pickupLongitude)
              : null,
          dropoffLocation: input.dropoffLocation,
          dropoffLatitude:
            input.dropoffLatitude != null
              ? new Prisma.Decimal(input.dropoffLatitude)
              : null,
          dropoffLongitude:
            input.dropoffLongitude != null
              ? new Prisma.Decimal(input.dropoffLongitude)
              : null,
          passengers: input.passengers,
          luggageCount: input.luggageCount ?? null,
          customerNotes: input.customerNotes ?? null,
          priceAmount: new Prisma.Decimal(price),
          commissionRate: new Prisma.Decimal(commissionRate),
          commissionAmount: new Prisma.Decimal(commissionAmount),
          partnerNetAmount: new Prisma.Decimal(partnerNetAmount),
          rentalStartDate: input.rentalStartDate
            ? new Date(input.rentalStartDate)
            : null,
          rentalEndDate: input.rentalEndDate
            ? new Date(input.rentalEndDate)
            : null,
        },
        include: {
          service: { include: { provider: true } },
          vehicle: true,
          driver: true,
        },
      });

      await tx.transportPayment.create({
        data: {
          transportBookingId: created.id,
          userId,
          amount: new Prisma.Decimal(price),
        },
      });

      return created;
    });

    this.emitter.emit(
      TransportEventNames.BOOKING_CREATED,
      new TransportBookingCreatedEvent(
        booking.id,
        userId,
        service.providerId,
        service.serviceType,
        price,
        bookingRef,
      ),
    );

    return booking;
  }

  async getMyBookings(userId: string) {
    return this.db.transportBooking.findMany({
      where: { userId, deletedAt: null },
      include: {
        service: { select: { name: true, serviceType: true, currency: true } },
        provider: { select: { businessName: true, phone: true } },
        vehicle: {
          select: {
            vehicleType: true,
            make: true,
            model: true,
            plateNumber: true,
          },
        },
        driver: { select: { name: true, phone: true } },
        payment: { select: { status: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBooking(transportBookingId: string, userId: string) {
    const booking = await this.db.transportBooking.findUnique({
      where: { id: transportBookingId },
      include: {
        service: true,
        provider: {
          select: {
            businessName: true,
            phone: true,
            email: true,
            verificationStatus: true,
          },
        },
        vehicle: true,
        driver: true,
        payment: true,
      },
    });
    if (!booking || booking.deletedAt)
      throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException('Access denied');
    return booking;
  }

  async cancelBooking(transportBookingId: string, userId: string) {
    const booking = await this.db.transportBooking.findUnique({
      where: { id: transportBookingId },
    });
    if (!booking || booking.deletedAt)
      throw new NotFoundException('Booking not found');
    if (booking.userId !== userId)
      throw new ForbiddenException('Access denied');
    if (!['REQUESTED', 'ACCEPTED'].includes(booking.status)) {
      throw new BadRequestException(
        'Only REQUESTED or ACCEPTED bookings can be cancelled',
      );
    }

    const updated = await this.db.transportBooking.update({
      where: { id: transportBookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Cancelled by customer',
      },
    });

    this.emitter.emit(
      TransportEventNames.BOOKING_CANCELLED,
      new TransportBookingCancelledEvent(
        booking.id,
        userId,
        booking.bookingRef,
      ),
    );

    return updated;
  }
}
