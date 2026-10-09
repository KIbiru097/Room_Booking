import { z } from 'zod';
export declare const transportServiceTypeSchema: z.ZodEnum<["AIRPORT_PICKUP", "AIRPORT_DROP_OFF", "HOTEL_TRANSFER", "PRIVATE_DRIVER", "CAR_RENTAL"]>;
export type TransportServiceType = z.infer<typeof transportServiceTypeSchema>;
export declare const vehicleTypeSchema: z.ZodEnum<["SEDAN", "SUV", "MINIVAN", "MINIBUS", "BUS", "OTHER"]>;
export type VehicleType = z.infer<typeof vehicleTypeSchema>;
export declare const transportBookingStatusSchema: z.ZodEnum<["REQUESTED", "ACCEPTED", "REJECTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]>;
export type TransportBookingStatus = z.infer<typeof transportBookingStatusSchema>;
export declare const transportProviderStatusSchema: z.ZodEnum<["DRAFT", "PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]>;
export declare const transportVerificationStatusSchema: z.ZodEnum<["PENDING", "VERIFIED", "EXPIRED", "REJECTED"]>;
export declare const createTransportProviderSchema: z.ZodObject<{
    businessName: z.ZodString;
    legalName: z.ZodOptional<z.ZodString>;
    phone: z.ZodString;
    email: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    cityId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    businessName: string;
    description?: string | undefined;
    cityId?: string | undefined;
    legalName?: string | undefined;
}, {
    email: string;
    phone: string;
    businessName: string;
    description?: string | undefined;
    cityId?: string | undefined;
    legalName?: string | undefined;
}>;
export type CreateTransportProviderInput = z.infer<typeof createTransportProviderSchema>;
export declare const updateTransportProviderSchema: z.ZodObject<{
    businessName: z.ZodOptional<z.ZodString>;
    legalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cityId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    description?: string | undefined;
    cityId?: string | undefined;
    businessName?: string | undefined;
    legalName?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    description?: string | undefined;
    cityId?: string | undefined;
    businessName?: string | undefined;
    legalName?: string | undefined;
}>;
export type UpdateTransportProviderInput = z.infer<typeof updateTransportProviderSchema>;
export declare const createTransportVehicleSchema: z.ZodObject<{
    vehicleType: z.ZodEnum<["SEDAN", "SUV", "MINIVAN", "MINIBUS", "BUS", "OTHER"]>;
    make: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    plateNumber: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
    passengerCapacity: z.ZodNumber;
    luggageCapacity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    vehicleType: "OTHER" | "SEDAN" | "SUV" | "MINIVAN" | "MINIBUS" | "BUS";
    plateNumber: string;
    passengerCapacity: number;
    luggageCapacity: number;
    make?: string | undefined;
    model?: string | undefined;
    year?: number | undefined;
    color?: string | undefined;
}, {
    vehicleType: "OTHER" | "SEDAN" | "SUV" | "MINIVAN" | "MINIBUS" | "BUS";
    plateNumber: string;
    passengerCapacity: number;
    make?: string | undefined;
    model?: string | undefined;
    year?: number | undefined;
    color?: string | undefined;
    luggageCapacity?: number | undefined;
}>;
export type CreateTransportVehicleInput = z.infer<typeof createTransportVehicleSchema>;
export declare const createTransportDriverSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    licenseNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    licenseNumber?: string | undefined;
}, {
    phone: string;
    name: string;
    licenseNumber?: string | undefined;
}>;
export type CreateTransportDriverInput = z.infer<typeof createTransportDriverSchema>;
export declare const createTransportServiceSchema: z.ZodObject<{
    name: z.ZodString;
    serviceType: z.ZodEnum<["AIRPORT_PICKUP", "AIRPORT_DROP_OFF", "HOTEL_TRANSFER", "PRIVATE_DRIVER", "CAR_RENTAL"]>;
    description: z.ZodOptional<z.ZodString>;
    fixedPrice: z.ZodNumber;
    passengerLimit: z.ZodNumber;
    luggageLimit: z.ZodOptional<z.ZodNumber>;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
    advanceBookingMinutes: z.ZodDefault<z.ZodNumber>;
    dailyRate: z.ZodOptional<z.ZodNumber>;
    depositAmount: z.ZodOptional<z.ZodNumber>;
    mileagePolicyKm: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    serviceType: "AIRPORT_PICKUP" | "AIRPORT_DROP_OFF" | "HOTEL_TRANSFER" | "PRIVATE_DRIVER" | "CAR_RENTAL";
    fixedPrice: number;
    passengerLimit: number;
    advanceBookingMinutes: number;
    description?: string | undefined;
    luggageLimit?: number | undefined;
    durationMinutes?: number | undefined;
    dailyRate?: number | undefined;
    depositAmount?: number | undefined;
    mileagePolicyKm?: number | undefined;
}, {
    name: string;
    serviceType: "AIRPORT_PICKUP" | "AIRPORT_DROP_OFF" | "HOTEL_TRANSFER" | "PRIVATE_DRIVER" | "CAR_RENTAL";
    fixedPrice: number;
    passengerLimit: number;
    description?: string | undefined;
    luggageLimit?: number | undefined;
    durationMinutes?: number | undefined;
    advanceBookingMinutes?: number | undefined;
    dailyRate?: number | undefined;
    depositAmount?: number | undefined;
    mileagePolicyKm?: number | undefined;
}>;
export type CreateTransportServiceInput = z.infer<typeof createTransportServiceSchema>;
export declare const updateTransportServiceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    serviceType: z.ZodOptional<z.ZodEnum<["AIRPORT_PICKUP", "AIRPORT_DROP_OFF", "HOTEL_TRANSFER", "PRIVATE_DRIVER", "CAR_RENTAL"]>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fixedPrice: z.ZodOptional<z.ZodNumber>;
    passengerLimit: z.ZodOptional<z.ZodNumber>;
    luggageLimit: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    durationMinutes: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    advanceBookingMinutes: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    dailyRate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    depositAmount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    mileagePolicyKm: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
} & {
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    serviceType?: "AIRPORT_PICKUP" | "AIRPORT_DROP_OFF" | "HOTEL_TRANSFER" | "PRIVATE_DRIVER" | "CAR_RENTAL" | undefined;
    fixedPrice?: number | undefined;
    passengerLimit?: number | undefined;
    luggageLimit?: number | undefined;
    durationMinutes?: number | undefined;
    advanceBookingMinutes?: number | undefined;
    dailyRate?: number | undefined;
    depositAmount?: number | undefined;
    mileagePolicyKm?: number | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    serviceType?: "AIRPORT_PICKUP" | "AIRPORT_DROP_OFF" | "HOTEL_TRANSFER" | "PRIVATE_DRIVER" | "CAR_RENTAL" | undefined;
    fixedPrice?: number | undefined;
    passengerLimit?: number | undefined;
    luggageLimit?: number | undefined;
    durationMinutes?: number | undefined;
    advanceBookingMinutes?: number | undefined;
    dailyRate?: number | undefined;
    depositAmount?: number | undefined;
    mileagePolicyKm?: number | undefined;
}>;
export type UpdateTransportServiceInput = z.infer<typeof updateTransportServiceSchema>;
export declare const createTransportBookingSchema: z.ZodObject<{
    serviceId: z.ZodString;
    tripId: z.ZodOptional<z.ZodString>;
    hotelBookingId: z.ZodOptional<z.ZodString>;
    pickupAt: z.ZodString;
    pickupLocation: z.ZodString;
    pickupLatitude: z.ZodOptional<z.ZodNumber>;
    pickupLongitude: z.ZodOptional<z.ZodNumber>;
    dropoffLocation: z.ZodString;
    dropoffLatitude: z.ZodOptional<z.ZodNumber>;
    dropoffLongitude: z.ZodOptional<z.ZodNumber>;
    passengers: z.ZodNumber;
    luggageCount: z.ZodOptional<z.ZodNumber>;
    customerNotes: z.ZodOptional<z.ZodString>;
    rentalStartDate: z.ZodOptional<z.ZodString>;
    rentalEndDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    pickupAt: string;
    pickupLocation: string;
    dropoffLocation: string;
    passengers: number;
    tripId?: string | undefined;
    hotelBookingId?: string | undefined;
    pickupLatitude?: number | undefined;
    pickupLongitude?: number | undefined;
    dropoffLatitude?: number | undefined;
    dropoffLongitude?: number | undefined;
    luggageCount?: number | undefined;
    customerNotes?: string | undefined;
    rentalStartDate?: string | undefined;
    rentalEndDate?: string | undefined;
}, {
    serviceId: string;
    pickupAt: string;
    pickupLocation: string;
    dropoffLocation: string;
    passengers: number;
    tripId?: string | undefined;
    hotelBookingId?: string | undefined;
    pickupLatitude?: number | undefined;
    pickupLongitude?: number | undefined;
    dropoffLatitude?: number | undefined;
    dropoffLongitude?: number | undefined;
    luggageCount?: number | undefined;
    customerNotes?: string | undefined;
    rentalStartDate?: string | undefined;
    rentalEndDate?: string | undefined;
}>;
export type CreateTransportBookingInput = z.infer<typeof createTransportBookingSchema>;
export declare const searchTransportServicesSchema: z.ZodObject<{
    serviceType: z.ZodOptional<z.ZodEnum<["AIRPORT_PICKUP", "AIRPORT_DROP_OFF", "HOTEL_TRANSFER", "PRIVATE_DRIVER", "CAR_RENTAL"]>>;
    cityId: z.ZodOptional<z.ZodString>;
    pickupDate: z.ZodOptional<z.ZodString>;
    passengers: z.ZodOptional<z.ZodNumber>;
    vehicleType: z.ZodOptional<z.ZodEnum<["SEDAN", "SUV", "MINIVAN", "MINIBUS", "BUS", "OTHER"]>>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    cityId?: string | undefined;
    vehicleType?: "OTHER" | "SEDAN" | "SUV" | "MINIVAN" | "MINIBUS" | "BUS" | undefined;
    serviceType?: "AIRPORT_PICKUP" | "AIRPORT_DROP_OFF" | "HOTEL_TRANSFER" | "PRIVATE_DRIVER" | "CAR_RENTAL" | undefined;
    passengers?: number | undefined;
    pickupDate?: string | undefined;
    maxPrice?: number | undefined;
}, {
    page?: number | undefined;
    cityId?: string | undefined;
    limit?: number | undefined;
    vehicleType?: "OTHER" | "SEDAN" | "SUV" | "MINIVAN" | "MINIBUS" | "BUS" | undefined;
    serviceType?: "AIRPORT_PICKUP" | "AIRPORT_DROP_OFF" | "HOTEL_TRANSFER" | "PRIVATE_DRIVER" | "CAR_RENTAL" | undefined;
    passengers?: number | undefined;
    pickupDate?: string | undefined;
    maxPrice?: number | undefined;
}>;
export type SearchTransportServicesInput = z.infer<typeof searchTransportServicesSchema>;
export declare const partnerAcceptBookingSchema: z.ZodObject<{
    transportBookingId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transportBookingId: string;
}, {
    transportBookingId: string;
}>;
export type PartnerAcceptBookingInput = z.infer<typeof partnerAcceptBookingSchema>;
export declare const partnerRejectBookingSchema: z.ZodObject<{
    transportBookingId: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    transportBookingId: string;
}, {
    reason: string;
    transportBookingId: string;
}>;
export type PartnerRejectBookingInput = z.infer<typeof partnerRejectBookingSchema>;
export declare const partnerAssignSchema: z.ZodObject<{
    transportBookingId: z.ZodString;
    vehicleId: z.ZodString;
    driverId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    transportBookingId: string;
    vehicleId: string;
    driverId?: string | undefined;
}, {
    transportBookingId: string;
    vehicleId: string;
    driverId?: string | undefined;
}>;
export type PartnerAssignInput = z.infer<typeof partnerAssignSchema>;
export declare const updateTransportBookingStatusSchema: z.ZodObject<{
    transportBookingId: z.ZodString;
    status: z.ZodEnum<["IN_PROGRESS", "COMPLETED", "NO_SHOW"]>;
}, "strip", z.ZodTypeAny, {
    status: "NO_SHOW" | "IN_PROGRESS" | "COMPLETED";
    transportBookingId: string;
}, {
    status: "NO_SHOW" | "IN_PROGRESS" | "COMPLETED";
    transportBookingId: string;
}>;
export type UpdateTransportBookingStatusInput = z.infer<typeof updateTransportBookingStatusSchema>;
export declare const adminVerifyProviderSchema: z.ZodObject<{
    action: z.ZodEnum<["VERIFY", "REJECT", "SUSPEND"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "VERIFY" | "REJECT" | "SUSPEND";
    notes?: string | undefined;
}, {
    action: "VERIFY" | "REJECT" | "SUSPEND";
    notes?: string | undefined;
}>;
export type AdminVerifyProviderInput = z.infer<typeof adminVerifyProviderSchema>;
export declare const listTransportProvidersQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]>>;
    verificationStatus: z.ZodOptional<z.ZodEnum<["PENDING", "VERIFIED", "EXPIRED", "REJECTED"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "REJECTED" | "ACTIVE" | "SUSPENDED" | "DRAFT" | "PENDING_REVIEW" | undefined;
    verificationStatus?: "PENDING" | "REJECTED" | "EXPIRED" | "VERIFIED" | undefined;
}, {
    status?: "REJECTED" | "ACTIVE" | "SUSPENDED" | "DRAFT" | "PENDING_REVIEW" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    verificationStatus?: "PENDING" | "REJECTED" | "EXPIRED" | "VERIFIED" | undefined;
}>;
export type ListTransportProvidersQuery = z.infer<typeof listTransportProvidersQuerySchema>;
export declare const transportBookingIdParamSchema: z.ZodObject<{
    transportBookingId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transportBookingId: string;
}, {
    transportBookingId: string;
}>;
export declare const transportProviderIdParamSchema: z.ZodObject<{
    transportProviderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transportProviderId: string;
}, {
    transportProviderId: string;
}>;
export declare const transportServiceIdParamSchema: z.ZodObject<{
    transportServiceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transportServiceId: string;
}, {
    transportServiceId: string;
}>;
//# sourceMappingURL=transport.d.ts.map