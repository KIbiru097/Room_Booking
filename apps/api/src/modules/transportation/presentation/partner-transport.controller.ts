import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PartnerTransportService } from '../application/partner-transport.service';
import {
  CreateTransportDriverDto,
  CreateTransportProviderDto,
  CreateTransportServiceDto,
  CreateTransportVehicleDto,
  PartnerAssignDto,
  PartnerRejectBookingDto,
  TransportBookingIdParamDto,
  TransportServiceIdParamDto,
  UpdateTransportBookingStatusDto,
  UpdateTransportProviderDto,
  UpdateTransportServiceDto,
} from './dto/transportation.dto';

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('partner-transportation')
@ApiBearerAuth()
@Controller('partner/transportation')
@Roles(Role.MANAGER, Role.STAFF, Role.ADMIN)
export class PartnerTransportController {
  constructor(private readonly partner: PartnerTransportService) {}

  @Get('provider')
  getProvider(@Req() req: AuthedRequest) {
    return this.partner.getOrCreateProvider(req.user.sub);
  }

  @Post('provider')
  createProvider(
    @Body() dto: CreateTransportProviderDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.createProvider(dto, req.user.sub);
  }

  @Patch('provider')
  updateProvider(
    @Body() dto: UpdateTransportProviderDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.updateProvider(dto, req.user.sub);
  }

  @Get('vehicles')
  listVehicles(@Req() req: AuthedRequest) {
    return this.partner.listVehicles(req.user.sub);
  }

  @Post('vehicles')
  createVehicle(
    @Body() dto: CreateTransportVehicleDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.createVehicle(dto, req.user.sub);
  }

  @Get('drivers')
  listDrivers(@Req() req: AuthedRequest) {
    return this.partner.listDrivers(req.user.sub);
  }

  @Post('drivers')
  createDriver(
    @Body() dto: CreateTransportDriverDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.createDriver(dto, req.user.sub);
  }

  @Get('services')
  listServices(@Req() req: AuthedRequest) {
    return this.partner.listServices(req.user.sub);
  }

  @Post('services')
  createService(
    @Body() dto: CreateTransportServiceDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.createService(dto, req.user.sub);
  }

  @Patch('services/:transportServiceId')
  updateService(
    @Param() params: TransportServiceIdParamDto,
    @Body() dto: UpdateTransportServiceDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.updateService(
      params.transportServiceId,
      dto,
      req.user.sub,
    );
  }

  @Get('bookings/pending')
  @ApiOperation({ summary: 'List pending bookings for the signed-in provider' })
  getPending(@Req() req: AuthedRequest) {
    return this.partner.getPendingBookings(req.user.sub);
  }

  @Get('bookings/upcoming')
  getUpcoming(@Req() req: AuthedRequest) {
    return this.partner.getUpcomingBookings(req.user.sub);
  }

  @Post('bookings/:transportBookingId/accept')
  accept(
    @Param() params: TransportBookingIdParamDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.acceptBooking(
      { transportBookingId: params.transportBookingId },
      req.user.sub,
    );
  }

  @Post('bookings/:transportBookingId/reject')
  reject(
    @Param() params: TransportBookingIdParamDto,
    @Body() dto: PartnerRejectBookingDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.rejectBooking(
      { ...dto, transportBookingId: params.transportBookingId },
      req.user.sub,
    );
  }

  @Post('bookings/:transportBookingId/assign')
  assign(
    @Param() params: TransportBookingIdParamDto,
    @Body() dto: PartnerAssignDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.assignBooking(
      { ...dto, transportBookingId: params.transportBookingId },
      req.user.sub,
    );
  }

  @Post('bookings/:transportBookingId/status')
  updateStatus(
    @Param() params: TransportBookingIdParamDto,
    @Body() dto: UpdateTransportBookingStatusDto,
    @Req() req: AuthedRequest,
  ) {
    return this.partner.updateBookingStatus(
      { ...dto, transportBookingId: params.transportBookingId },
      req.user.sub,
    );
  }

  @Get('dashboard')
  getDashboard(@Req() req: AuthedRequest) {
    return this.partner.getDashboard(req.user.sub);
  }

  @Get('earnings')
  getEarnings(@Req() req: AuthedRequest) {
    return this.partner.getEarnings(req.user.sub);
  }
}
