import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CouponService } from '../application/coupon.service';
import {
  CouponIdParamsDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/coupon.dto';

interface AuthedRequest {
  user: { sub: string; role: string };
}

@ApiTags('coupons (manager)')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('manager/coupons')
export class ManagerCouponController {
  constructor(private readonly coupons: CouponService) {}

  @Get()
  @Permissions('coupon.view')
  @ApiOperation({ summary: 'List coupons for the manager-owned hotel' })
  list(@Req() req: AuthedRequest) {
    return this.coupons.listForManager(req.user.sub);
  }

  @Post()
  @Permissions('coupon.create')
  @ApiOperation({ summary: 'Create a coupon for the manager-owned hotel' })
  create(@Body() dto: CreateCouponDto, @Req() req: AuthedRequest) {
    return this.coupons.createForManager(dto, req.user.sub);
  }

  @Patch(':id')
  @Permissions('coupon.edit')
  @ApiOperation({ summary: 'Update a coupon owned by the manager hotel' })
  update(
    @Param() params: CouponIdParamsDto,
    @Body() dto: UpdateCouponDto,
    @Req() req: AuthedRequest,
  ) {
    return this.coupons.updateForManager(params.id, dto, req.user.sub);
  }

  @Delete(':id')
  @Permissions('coupon.delete')
  @ApiOperation({ summary: 'Deactivate a hotel coupon' })
  deactivate(@Param() params: CouponIdParamsDto, @Req() req: AuthedRequest) {
    return this.coupons.deactivateForManager(params.id, req.user.sub);
  }
}
