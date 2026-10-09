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
  TransportBookingAcceptedEvent,
  TransportBookingRejectedEvent,
  TransportDriverAssignedEvent,
  TransportBookingCompletedEvent,
} from '../../events/transport.events';
import type {
  CreateTransportProviderInput,
  UpdateTransportProviderInput,
  CreateTransportVehicleInput,
  CreateTransportDriverInput,
  CreateTransportServiceInput,
  UpdateTransportServiceInput,
  PartnerAcceptBookingInput,
  PartnerRejectBookingInput,
  PartnerAssignInput,
  UpdateTransportBookingStatusInput,
} from '@repo/shared-types';

@Injectable()
export class PartnerTransportService {
  constructor(
    private readonly db: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  // ── Provider ──────────────────────────────────────────────────────────────

  private async requireProvider(userId: string) {
    const provider = await this.db.transportProvider.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!provider)
      throw new NotFoundException(
        'No provider profile found. Please create one first.',
      );
    return provider;
  }

  async getOrCreateProvider(userId: string) {
    const existing = await this.db.transportProvider.findFirst({
      where: { userId, deletedAt: null },
      include: {
        vehicles: true,
        drivers: true,
        services: { where: { isActive: true } },
      },
    });
    return existing ?? null;
  }

  async createProvider(input: CreateTransportProviderInput, userId: string) {
    const existing = await this.db.transportProvider.findFirst({
      where: { userId, deletedAt: null },
    });
    if (existing)
      throw new BadRequestException('Provider profile already exists');

    return this.db.transportProvider.create({
      data: {
        userId,
        businessName: input.businessName,
        legalName: input.legalName ?? null,
        phone: input.phone,
        email: input.email,
        description: input.description ?? null,
        cityId: input.cityId ?? null,
      },
    });
  }

  async updateProvider(input: UpdateTransportProviderInput, userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportProvider.update({
      where: { id: provider.id },
      data: {
        businessName: input.businessName ?? undefined,
        legalName: input.legalName ?? undefined,
        phone: input.phone ?? undefined,
        email: input.email ?? undefined,
        description: input.description ?? undefined,
        cityId: input.cityId ?? undefined,
      },
    });
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────

  async createVehicle(input: CreateTransportVehicleInput, userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportVehicle.create({
      data: {
        providerId: provider.id,
        vehicleType: input.vehicleType,
        make: input.make ?? null,
        model: input.model ?? null,
        year: input.year ?? null,
        plateNumber: input.plateNumber,
        color: input.color ?? null,
        passengerCapacity: input.passengerCapacity,
        luggageCapacity: input.luggageCapacity ?? 0,
      },
    });
  }

  async listVehicles(userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportVehicle.findMany({
      where: { providerId: provider.id },
    });
  }

  // ── Drivers ───────────────────────────────────────────────────────────────

  async createDriver(input: CreateTransportDriverInput, userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportDriver.create({
      data: {
        providerId: provider.id,
        name: input.name,
        phone: input.phone,
        licenseNumber: input.licenseNumber ?? null,
      },
    });
  }

  async listDrivers(userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportDriver.findMany({
      where: { providerId: provider.id, status: 'ACTIVE' },
    });
  }

  // ── Services ──────────────────────────────────────────────────────────────

  async createService(input: CreateTransportServiceInput, userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportService.create({
      data: {
        providerId: provider.id,
        name: input.name,
        serviceType: input.serviceType,
        description: input.description ?? null,
        fixedPrice: new Prisma.Decimal(input.fixedPrice),
        passengerLimit: input.passengerLimit,
        luggageLimit: input.luggageLimit ?? null,
        durationMinutes: input.durationMinutes ?? null,
        advanceBookingMinutes: input.advanceBookingMinutes ?? 60,
        dailyRate:
          input.dailyRate != null ? new Prisma.Decimal(input.dailyRate) : null,
        depositAmount:
          input.depositAmount != null
            ? new Prisma.Decimal(input.depositAmount)
            : null,
        mileagePolicyKm: input.mileagePolicyKm ?? null,
      },
    });
  }

  async listServices(userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportService.findMany({
      where: { providerId: provider.id },
    });
  }

  async updateService(
    serviceId: string,
    input: UpdateTransportServiceInput,
    userId: string,
  ) {
    const provider = await this.requireProvider(userId);
    const service = await this.db.transportService.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.providerId !== provider.id)
      throw new ForbiddenException('Service not found');

    return this.db.transportService.update({
      where: { id: serviceId },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        fixedPrice:
          input.fixedPrice != null
            ? new Prisma.Decimal(input.fixedPrice)
            : undefined,
        passengerLimit: input.passengerLimit ?? undefined,
        luggageLimit: input.luggageLimit ?? undefined,
        durationMinutes: input.durationMinutes ?? undefined,
        advanceBookingMinutes: input.advanceBookingMinutes ?? undefined,
        dailyRate:
          input.dailyRate != null
            ? new Prisma.Decimal(input.dailyRate)
            : undefined,
        depositAmount:
          input.depositAmount != null
            ? new Prisma.Decimal(input.depositAmount)
            : undefined,
        mileagePolicyKm: input.mileagePolicyKm ?? undefined,
        isActive: input.isActive ?? undefined,
      },
    });
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  private async requireBookingOwnership(
    transportBookingId: string,
    userId: string,
  ) {
    const provider = await this.requireProvider(userId);
    const booking = await this.db.transportBooking.findUnique({
      where: { id: transportBookingId },
      include: { vehicle: true, driver: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.providerId !== provider.id)
      throw new ForbiddenException('Access denied');
    return { booking, provider };
  }

  async getPendingBookings(userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportBooking.findMany({
      where: { providerId: provider.id, status: 'REQUESTED', deletedAt: null },
      include: {
        service: true,
        user: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUpcomingBookings(userId: string) {
    const provider = await this.requireProvider(userId);
    return this.db.transportBooking.findMany({
      where: {
        providerId: provider.id,
        status: { in: ['ACCEPTED', 'ASSIGNED'] },
        pickupAt: { gte: new Date() },
        deletedAt: null,
      },
      include: {
        service: true,
        vehicle: true,
        driver: true,
        user: { select: { fullName: true, phone: true } },
      },
      orderBy: { pickupAt: 'asc' },
    });
  }

  async acceptBooking(input: PartnerAcceptBookingInput, userId: string) {
    const { booking } = await this.requireBookingOwnership(
      input.transportBookingId,
      userId,
    );
    if (booking.status !== 'REQUESTED') {
      throw new BadRequestException('Only REQUESTED bookings can be accepted');
    }

    const updated = await this.db.transportBooking.update({
      where: { id: booking.id },
      data: { status: 'ACCEPTED' },
    });

    this.emitter.emit(
      TransportEventNames.BOOKING_ACCEPTED,
      new TransportBookingAcceptedEvent(
        booking.id,
        booking.userId,
        booking.providerId,
        booking.bookingRef,
      ),
    );

    return updated;
  }

  async rejectBooking(input: PartnerRejectBookingInput, userId: string) {
    const { booking } = await this.requireBookingOwnership(
      input.transportBookingId,
      userId,
    );
    if (booking.status !== 'REQUESTED') {
      throw new BadRequestException('Only REQUESTED bookings can be rejected');
    }

    const updated = await this.db.transportBooking.update({
      where: { id: booking.id },
      data: { status: 'REJECTED', cancellationReason: input.reason },
    });

    this.emitter.emit(
      TransportEventNames.BOOKING_REJECTED,
      new TransportBookingRejectedEvent(
        booking.id,
        booking.userId,
        input.reason,
        booking.bookingRef,
      ),
    );

    return updated;
  }

  async assignBooking(input: PartnerAssignInput, userId: string) {
    const { booking, provider } = await this.requireBookingOwnership(
      input.transportBookingId,
      userId,
    );
    if (booking.status !== 'ACCEPTED') {
      throw new BadRequestException('Only ACCEPTED bookings can be assigned');
    }

    // Verify vehicle belongs to this provider
    const vehicle = await this.db.transportVehicle.findUnique({
      where: { id: input.vehicleId },
    });
    if (!vehicle || vehicle.providerId !== provider.id) {
      throw new ForbiddenException(
        'Vehicle not found or does not belong to your fleet',
      );
    }

    let driverName = 'TBA';
    if (input.driverId) {
      const driver = await this.db.transportDriver.findUnique({
        where: { id: input.driverId },
      });
      if (!driver || driver.providerId !== provider.id) {
        throw new ForbiddenException(
          'Driver not found or does not belong to your fleet',
        );
      }
      driverName = driver.name;
    }

    const updated = await this.db.transportBooking.update({
      where: { id: booking.id },
      data: {
        status: 'ASSIGNED',
        vehicleId: input.vehicleId,
        driverId: input.driverId ?? null,
      },
      include: { vehicle: true, driver: true },
    });

    this.emitter.emit(
      TransportEventNames.DRIVER_ASSIGNED,
      new TransportDriverAssignedEvent(
        booking.id,
        booking.userId,
        driverName,
        vehicle.plateNumber,
        booking.bookingRef,
      ),
    );

    return updated;
  }

  async updateBookingStatus(
    input: UpdateTransportBookingStatusInput,
    userId: string,
  ) {
    const { booking } = await this.requireBookingOwnership(
      input.transportBookingId,
      userId,
    );

    const allowed: Record<string, string[]> = {
      IN_PROGRESS: ['ASSIGNED'],
      COMPLETED: ['IN_PROGRESS', 'ASSIGNED'],
      NO_SHOW: ['ASSIGNED', 'ACCEPTED'],
    };

    if (!allowed[input.status]?.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${input.status}`,
      );
    }

    const updated = await this.db.transportBooking.update({
      where: { id: booking.id },
      data: { status: input.status },
    });

    if (input.status === 'COMPLETED') {
      this.emitter.emit(
        TransportEventNames.BOOKING_COMPLETED,
        new TransportBookingCompletedEvent(
          booking.id,
          booking.userId,
          booking.providerId,
          booking.bookingRef,
        ),
      );
    }

    return updated;
  }

  // ── Dashboard & earnings ───────────────────────────────────────────────────

  async getDashboard(userId: string) {
    const provider = await this.requireProvider(userId);
    const pid = provider.id;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingCount,
      acceptedCount,
      upcomingToday,
      completedThisMonth,
      revenueResult,
    ] = await Promise.all([
      this.db.transportBooking.count({
        where: { providerId: pid, status: 'REQUESTED' },
      }),
      this.db.transportBooking.count({
        where: { providerId: pid, status: { in: ['ACCEPTED', 'ASSIGNED'] } },
      }),
      this.db.transportBooking.count({
        where: {
          providerId: pid,
          status: { in: ['ACCEPTED', 'ASSIGNED'] },
          pickupAt: {
            gte: startOfToday,
            lt: new Date(startOfToday.getTime() + 86400000),
          },
        },
      }),
      this.db.transportBooking.count({
        where: {
          providerId: pid,
          status: 'COMPLETED',
          updatedAt: { gte: startOfMonth },
        },
      }),
      this.db.transportBooking.aggregate({
        _sum: { priceAmount: true, partnerNetAmount: true },
        where: { providerId: pid, status: 'COMPLETED' },
      }),
    ]);

    return {
      pendingCount,
      acceptedCount,
      upcomingToday,
      completedThisMonth,
      grossRevenue: Number(revenueResult._sum.priceAmount ?? 0),
      netRevenue: Number(revenueResult._sum.partnerNetAmount ?? 0),
    };
  }

  async getEarnings(userId: string) {
    const provider = await this.requireProvider(userId);
    const bookings = await this.db.transportBooking.findMany({
      where: { providerId: provider.id, status: 'COMPLETED' },
      select: {
        priceAmount: true,
        partnerNetAmount: true,
        commissionAmount: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by month
    const byMonth: Record<
      string,
      { gross: number; net: number; commission: number; count: number }
    > = {};
    for (const b of bookings) {
      const key = `${b.updatedAt.getFullYear()}-${String(b.updatedAt.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key])
        byMonth[key] = { gross: 0, net: 0, commission: 0, count: 0 };
      byMonth[key].gross += Number(b.priceAmount);
      byMonth[key].net += Number(b.partnerNetAmount ?? 0);
      byMonth[key].commission += Number(b.commissionAmount ?? 0);
      byMonth[key].count++;
    }

    return Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }
}
