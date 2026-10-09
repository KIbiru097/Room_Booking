export const TransportEventNames = {
  BOOKING_CREATED: 'transport.booking.created',
  BOOKING_ACCEPTED: 'transport.booking.accepted',
  BOOKING_REJECTED: 'transport.booking.rejected',
  DRIVER_ASSIGNED: 'transport.driver.assigned',
  BOOKING_CANCELLED: 'transport.booking.cancelled',
  BOOKING_COMPLETED: 'transport.booking.completed',
  PROVIDER_VERIFIED: 'transport.provider.verified',
  PROVIDER_SUSPENDED: 'transport.provider.suspended',
} as const;

export class TransportBookingCreatedEvent {
  constructor(
    public readonly transportBookingId: string,
    public readonly userId: string,
    public readonly providerId: string,
    public readonly serviceType: string,
    public readonly priceAmount: number,
    public readonly bookingRef: string,
  ) {}
}

export class TransportBookingAcceptedEvent {
  constructor(
    public readonly transportBookingId: string,
    public readonly userId: string,
    public readonly providerId: string,
    public readonly bookingRef: string,
  ) {}
}

export class TransportBookingRejectedEvent {
  constructor(
    public readonly transportBookingId: string,
    public readonly userId: string,
    public readonly reason: string,
    public readonly bookingRef: string,
  ) {}
}

export class TransportDriverAssignedEvent {
  constructor(
    public readonly transportBookingId: string,
    public readonly userId: string,
    public readonly driverName: string,
    public readonly vehiclePlate: string,
    public readonly bookingRef: string,
  ) {}
}

export class TransportBookingCancelledEvent {
  constructor(
    public readonly transportBookingId: string,
    public readonly userId: string,
    public readonly bookingRef: string,
  ) {}
}

export class TransportBookingCompletedEvent {
  constructor(
    public readonly transportBookingId: string,
    public readonly userId: string,
    public readonly providerId: string,
    public readonly bookingRef: string,
  ) {}
}

export class TransportProviderVerifiedEvent {
  constructor(
    public readonly providerId: string,
    public readonly userId: string,
    public readonly action: 'VERIFY' | 'REJECT' | 'SUSPEND',
  ) {}
}
