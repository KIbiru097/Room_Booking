"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportServiceIdParamSchema = exports.transportProviderIdParamSchema = exports.transportBookingIdParamSchema = exports.listTransportProvidersQuerySchema = exports.adminVerifyProviderSchema = exports.updateTransportBookingStatusSchema = exports.partnerAssignSchema = exports.partnerRejectBookingSchema = exports.partnerAcceptBookingSchema = exports.searchTransportServicesSchema = exports.createTransportBookingSchema = exports.updateTransportServiceSchema = exports.createTransportServiceSchema = exports.createTransportDriverSchema = exports.createTransportVehicleSchema = exports.updateTransportProviderSchema = exports.createTransportProviderSchema = exports.transportVerificationStatusSchema = exports.transportProviderStatusSchema = exports.transportBookingStatusSchema = exports.vehicleTypeSchema = exports.transportServiceTypeSchema = void 0;
const zod_1 = require("zod");
// ─── Enums ────────────────────────────────────────────────────────────────────
exports.transportServiceTypeSchema = zod_1.z.enum([
    'AIRPORT_PICKUP',
    'AIRPORT_DROP_OFF',
    'HOTEL_TRANSFER',
    'PRIVATE_DRIVER',
    'CAR_RENTAL',
]);
exports.vehicleTypeSchema = zod_1.z.enum([
    'SEDAN',
    'SUV',
    'MINIVAN',
    'MINIBUS',
    'BUS',
    'OTHER',
]);
exports.transportBookingStatusSchema = zod_1.z.enum([
    'REQUESTED',
    'ACCEPTED',
    'REJECTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
]);
exports.transportProviderStatusSchema = zod_1.z.enum([
    'DRAFT',
    'PENDING_REVIEW',
    'ACTIVE',
    'SUSPENDED',
    'REJECTED',
]);
exports.transportVerificationStatusSchema = zod_1.z.enum([
    'PENDING',
    'VERIFIED',
    'EXPIRED',
    'REJECTED',
]);
// ─── Provider ─────────────────────────────────────────────────────────────────
exports.createTransportProviderSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2).max(120),
    legalName: zod_1.z.string().min(2).max(120).optional(),
    phone: zod_1.z.string().min(6).max(32),
    email: zod_1.z.string().email(),
    description: zod_1.z.string().max(1000).optional(),
    cityId: zod_1.z.string().cuid().optional(),
});
exports.updateTransportProviderSchema = exports.createTransportProviderSchema.partial();
// ─── Vehicle ──────────────────────────────────────────────────────────────────
exports.createTransportVehicleSchema = zod_1.z.object({
    vehicleType: exports.vehicleTypeSchema,
    make: zod_1.z.string().max(60).optional(),
    model: zod_1.z.string().max(60).optional(),
    year: zod_1.z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
    plateNumber: zod_1.z.string().min(2).max(20),
    color: zod_1.z.string().max(40).optional(),
    passengerCapacity: zod_1.z.number().int().min(1).max(100),
    luggageCapacity: zod_1.z.number().int().min(0).max(100).default(0),
});
// ─── Driver ───────────────────────────────────────────────────────────────────
exports.createTransportDriverSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    phone: zod_1.z.string().min(6).max(32),
    licenseNumber: zod_1.z.string().max(50).optional(),
});
// ─── Service ──────────────────────────────────────────────────────────────────
exports.createTransportServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
    serviceType: exports.transportServiceTypeSchema,
    description: zod_1.z.string().max(1000).optional(),
    fixedPrice: zod_1.z.number().positive(),
    passengerLimit: zod_1.z.number().int().min(1).max(100),
    luggageLimit: zod_1.z.number().int().min(0).optional(),
    durationMinutes: zod_1.z.number().int().min(1).optional(),
    advanceBookingMinutes: zod_1.z.number().int().min(0).default(60),
    // Car rental
    dailyRate: zod_1.z.number().positive().optional(),
    depositAmount: zod_1.z.number().nonnegative().optional(),
    mileagePolicyKm: zod_1.z.number().int().positive().optional(),
});
exports.updateTransportServiceSchema = exports.createTransportServiceSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
// ─── Booking ──────────────────────────────────────────────────────────────────
exports.createTransportBookingSchema = zod_1.z.object({
    serviceId: zod_1.z.string().cuid(),
    tripId: zod_1.z.string().cuid().optional(),
    hotelBookingId: zod_1.z.string().cuid().optional(),
    pickupAt: zod_1.z.string().datetime(),
    pickupLocation: zod_1.z.string().min(2).max(255),
    pickupLatitude: zod_1.z.number().min(-90).max(90).optional(),
    pickupLongitude: zod_1.z.number().min(-180).max(180).optional(),
    dropoffLocation: zod_1.z.string().min(2).max(255),
    dropoffLatitude: zod_1.z.number().min(-90).max(90).optional(),
    dropoffLongitude: zod_1.z.number().min(-180).max(180).optional(),
    passengers: zod_1.z.number().int().min(1).max(50),
    luggageCount: zod_1.z.number().int().min(0).optional(),
    customerNotes: zod_1.z.string().max(500).optional(),
    // Car rental
    rentalStartDate: zod_1.z.string().datetime().optional(),
    rentalEndDate: zod_1.z.string().datetime().optional(),
});
// ─── Search ───────────────────────────────────────────────────────────────────
exports.searchTransportServicesSchema = zod_1.z.object({
    serviceType: exports.transportServiceTypeSchema.optional(),
    cityId: zod_1.z.string().optional(),
    pickupDate: zod_1.z.string().optional(),
    passengers: zod_1.z.coerce.number().int().min(1).optional(),
    vehicleType: exports.vehicleTypeSchema.optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
});
// ─── Partner actions ──────────────────────────────────────────────────────────
exports.partnerAcceptBookingSchema = zod_1.z.object({
    transportBookingId: zod_1.z.string().cuid(),
});
exports.partnerRejectBookingSchema = zod_1.z.object({
    transportBookingId: zod_1.z.string().cuid(),
    reason: zod_1.z.string().min(5).max(500),
});
exports.partnerAssignSchema = zod_1.z.object({
    transportBookingId: zod_1.z.string().cuid(),
    vehicleId: zod_1.z.string().cuid(),
    driverId: zod_1.z.string().cuid().optional(),
});
exports.updateTransportBookingStatusSchema = zod_1.z.object({
    transportBookingId: zod_1.z.string().cuid(),
    status: zod_1.z.enum(['IN_PROGRESS', 'COMPLETED', 'NO_SHOW']),
});
// ─── Admin ────────────────────────────────────────────────────────────────────
exports.adminVerifyProviderSchema = zod_1.z.object({
    action: zod_1.z.enum(['VERIFY', 'REJECT', 'SUSPEND']),
    notes: zod_1.z.string().max(500).optional(),
});
exports.listTransportProvidersQuerySchema = zod_1.z.object({
    status: exports.transportProviderStatusSchema.optional(),
    verificationStatus: exports.transportVerificationStatusSchema.optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// ─── Param schemas ────────────────────────────────────────────────────────────
exports.transportBookingIdParamSchema = zod_1.z.object({
    transportBookingId: zod_1.z.string().cuid(),
});
exports.transportProviderIdParamSchema = zod_1.z.object({
    transportProviderId: zod_1.z.string().cuid(),
});
exports.transportServiceIdParamSchema = zod_1.z.object({
    transportServiceId: zod_1.z.string().cuid(),
});
