import { createZodDto } from 'nestjs-zod';
import {
  createTransportProviderSchema,
  updateTransportProviderSchema,
  createTransportVehicleSchema,
  createTransportDriverSchema,
  createTransportServiceSchema,
  updateTransportServiceSchema,
  createTransportBookingSchema,
  searchTransportServicesSchema,
  partnerAcceptBookingSchema,
  partnerRejectBookingSchema,
  partnerAssignSchema,
  updateTransportBookingStatusSchema,
  adminVerifyProviderSchema,
  listTransportProvidersQuerySchema,
  transportBookingIdParamSchema,
  transportProviderIdParamSchema,
  transportServiceIdParamSchema,
} from '@repo/shared-types';

export class CreateTransportProviderDto extends createZodDto(
  createTransportProviderSchema,
) {}
export class UpdateTransportProviderDto extends createZodDto(
  updateTransportProviderSchema,
) {}
export class CreateTransportVehicleDto extends createZodDto(
  createTransportVehicleSchema,
) {}
export class CreateTransportDriverDto extends createZodDto(
  createTransportDriverSchema,
) {}
export class CreateTransportServiceDto extends createZodDto(
  createTransportServiceSchema,
) {}
export class UpdateTransportServiceDto extends createZodDto(
  updateTransportServiceSchema,
) {}
export class CreateTransportBookingDto extends createZodDto(
  createTransportBookingSchema,
) {}
export class SearchTransportServicesDto extends createZodDto(
  searchTransportServicesSchema,
) {}
export class PartnerAcceptBookingDto extends createZodDto(
  partnerAcceptBookingSchema,
) {}
export class PartnerRejectBookingDto extends createZodDto(
  partnerRejectBookingSchema,
) {}
export class PartnerAssignDto extends createZodDto(partnerAssignSchema) {}
export class UpdateTransportBookingStatusDto extends createZodDto(
  updateTransportBookingStatusSchema,
) {}
export class AdminVerifyProviderDto extends createZodDto(
  adminVerifyProviderSchema,
) {}
export class ListTransportProvidersQueryDto extends createZodDto(
  listTransportProvidersQuerySchema,
) {}
export class TransportBookingIdParamDto extends createZodDto(
  transportBookingIdParamSchema,
) {}
export class TransportProviderIdParamDto extends createZodDto(
  transportProviderIdParamSchema,
) {}
export class TransportServiceIdParamDto extends createZodDto(
  transportServiceIdParamSchema,
) {}
