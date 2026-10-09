import { Module } from '@nestjs/common';
import { CouponService } from './application/coupon.service';
import { CouponController } from './presentation/coupon.controller';
import { ManagerCouponController } from './presentation/manager-coupon.controller';
import { ResourceScopeHelper } from '../../common/guards/resource-scope.helper';

@Module({
  controllers: [CouponController, ManagerCouponController],
  providers: [CouponService, ResourceScopeHelper],
  exports: [CouponService],
})
export class CouponModule {}
