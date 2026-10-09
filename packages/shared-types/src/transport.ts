import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const transportServiceTypeSchema = z.enum([
  'AIRPORT_PICKUP',
  'AIRPORT_DROP_OFF',
  'HOTEL_TRANSFER',
  'PRIVATE_DRIVER',
  'CAR_RENTAL',
]);
export type TransportServiceType = z.infer<typeof transportServiceTypeSchema>;

export const vehicleTypeSchema = z.enum([
  'SEDAN',
  'SUV',
  'MINIVAN',
  'MINIBUS',
  'BUS',
  'OTHER',
]);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const transportBookingStatusSchema = z.enum([
  'REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
export type TransportBookingStatus = z.infer<typeof transportBookingStatusSchema>;

export const transportProviderStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
]);

export const transportVerificationStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'EXPIRED',
  'REJECTED',
]);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const createTransportProviderSchema = z.object({
  businessName: z.string().min(2).max(120),
  legalName: z.string().min(2).max(120).optional(),
  phone: z.string().min(6).max(32),
  email: z.string().email(),
  description: z.string().max(1000).optional(),
  cityId: z.string().cuid().optional(),
});
export type CreateTransportProviderInput = z.infer<typeof createTransportProviderSchema>;

export const updateTransportProviderSchema = createTransportProviderSchema.partial();
export type UpdateTransportProviderInput = z.infer<typeof updateTransportProviderSchema>;

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export const createTransportVehicleSchema = z.object({
  vehicleType: vehicleTypeSchema,
  make: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  plateNumber: z.string().min(2).max(20),
  color: z.string().max(40).optional(),
  passengerCapacity: z.number().int().min(1).max(100),
  luggageCapacity: z.number().int().min(0).max(100).default(0),
});
export type CreateTransportVehicleInput = z.infer<typeof createTransportVehicleSchema>;

// ─── Driver ───────────────────────────────────────────────────────────────────

export const createTransportDriverSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(6).max(32),
  licenseNumber: z.string().max(50).optional(),
});
export type CreateTransportDriverInput = z.infer<typeof createTransportDriverSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export const createTransportServiceSchema = z.object({
  name: z.string().min(2).max(120),
  serviceType: transportServiceTypeSchema,
  description: z.string().max(1000).optional(),
  fixedPrice: z.number().positive(),
  passengerLimit: z.number().int().min(1).max(100),
  luggageLimit: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  advanceBookingMinutes: z.number().int().min(0).default(60),
  // Car rental
  dailyRate: z.number().positive().optional(),
  depositAmount: z.number().nonnegative().optional(),
  mileagePolicyKm: z.number().int().positive().optional(),
});
export type CreateTransportServiceInput = z.infer<typeof createTransportServiceSchema>;

export const updateTransportServiceSchema = createTransportServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateTransportServiceInput = z.infer<typeof updateTransportServiceSchema>;

// ─── Booking ──────────────────────────────────────────────────────────────────

export const createTransportBookingSchema = z.object({
  serviceId: z.string().cuid(),
  tripId: z.string().cuid().optional(),
  hotelBookingId: z.string().cuid().optional(),
  pickupAt: z.string().datetime(),
  pickupLocation: z.string().min(2).max(255),
  pickupLatitude: z.number().min(-90).max(90).optional(),
  pickupLongitude: z.number().min(-180).max(180).optional(),
  dropoffLocation: z.string().min(2).max(255),
  dropoffLatitude: z.number().min(-90).max(90).optional(),
  dropoffLongitude: z.number().min(-180).max(180).optional(),
  passengers: z.number().int().min(1).max(50),
  luggageCount: z.number().int().min(0).optional(),
  customerNotes: z.string().max(500).optional(),
  // Car rental
  rentalStartDate: z.string().datetime().optional(),
  rentalEndDate: z.string().datetime().optional(),
});
export type CreateTransportBookingInput = z.infer<typeof createTransportBookingSchema>;

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchTransportServicesSchema = z.object({
  serviceType: transportServiceTypeSchema.optional(),
  cityId: z.string().optional(),
  pickupDate: z.string().optional(),
  passengers: z.coerce.number().int().min(1).optional(),
  vehicleType: vehicleTypeSchema.optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchTransportServicesInput = z.infer<typeof searchTransportServicesSchema>;

// ─── Partner actions ──────────────────────────────────────────────────────────

export const partnerAcceptBookingSchema = z.object({
  transportBookingId: z.string().cuid(),
});
export type PartnerAcceptBookingInput = z.infer<typeof partnerAcceptBookingSchema>;

export const partnerRejectBookingSchema = z.object({
  transportBookingId: z.string().cuid(),
  reason: z.string().min(5).max(500),
});
export type PartnerRejectBookingInput = z.infer<typeof partnerRejectBookingSchema>;

export const partnerAssignSchema = z.object({
  transportBookingId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  driverId: z.string().cuid().optional(),
});
export type PartnerAssignInput = z.infer<typeof partnerAssignSchema>;

export const updateTransportBookingStatusSchema = z.object({
  transportBookingId: z.string().cuid(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'NO_SHOW']),
});
export type UpdateTransportBookingStatusInput = z.infer<typeof updateTransportBookingStatusSchema>;

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminVerifyProviderSchema = z.object({
  action: z.enum(['VERIFY', 'REJECT', 'SUSPEND']),
  notes: z.string().max(500).optional(),
});
export type AdminVerifyProviderInput = z.infer<typeof adminVerifyProviderSchema>;

export const listTransportProvidersQuerySchema = z.object({
  status: transportProviderStatusSchema.optional(),
  verificationStatus: transportVerificationStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTransportProvidersQuery = z.infer<typeof listTransportProvidersQuerySchema>;

// ─── Param schemas ────────────────────────────────────────────────────────────

export const transportBookingIdParamSchema = z.object({
  transportBookingId: z.string().cuid(),
});

export const transportProviderIdParamSchema = z.object({
  transportProviderId: z.string().cuid(),
});

export const transportServiceIdParamSchema = z.object({
  transportServiceId: z.string().cuid(),
});
