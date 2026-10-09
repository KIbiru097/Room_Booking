import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { TransportationService } from '../application/transportation.service';
import {
  CreateTransportBookingDto,
  SearchTransportServicesDto,
  TransportBookingIdParamDto,
  TransportServiceIdParamDto,
} from './dto/transportation.dto';

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('transportation')
@ApiBearerAuth()
@Controller('transportation')
export class TransportationController {
  constructor(private readonly transportation: TransportationService) {}

  @Get('services')
  @Public()
  @ApiOperation({
    summary: 'Search verified airport transfer and car rental services',
  })
  search(@Query() query: SearchTransportServicesDto) {
    return this.transportation.searchServices(query);
  }

  @Get('services/:transportServiceId')
  @Public()
  @ApiOperation({ summary: 'Get one verified transport service' })
  getService(@Param() params: TransportServiceIdParamDto) {
    return this.transportation.getService(params.transportServiceId);
  }

  @Post('bookings')
  @Roles(Role.CUSTOMER)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Request an airport transfer or car rental' })
  createBooking(
    @Body() dto: CreateTransportBookingDto,
    @Req() req: AuthedRequest,
  ) {
    return this.transportation.createBooking(dto, req.user.sub);
  }

  @Get('bookings')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List the current customer transport bookings' })
  listBookings(@Req() req: AuthedRequest) {
    return this.transportation.getMyBookings(req.user.sub);
  }

  @Get('bookings/:transportBookingId')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get one customer transport booking' })
  getBooking(
    @Param() params: TransportBookingIdParamDto,
    @Req() req: AuthedRequest,
  ) {
    return this.transportation.getBooking(
      params.transportBookingId,
      req.user.sub,
    );
  }

  @Post('bookings/:transportBookingId/cancel')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Cancel a requested or accepted transport booking' })
  cancelBooking(
    @Param() params: TransportBookingIdParamDto,
    @Req() req: AuthedRequest,
  ) {
    return this.transportation.cancelBooking(
      params.transportBookingId,
      req.user.sub,
    );
  }
}
