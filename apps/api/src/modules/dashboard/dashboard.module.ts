import { Module } from '@nestjs/common';
import { ResourceScopeHelper } from '../../common/guards/resource-scope.helper';
import { AuditService } from '../../common/services/audit.service';
import { DashboardService } from './application/dashboard.service';
import { ManagerDashboardController } from './presentation/manager-dashboard.controller';

@Module({
  controllers: [ManagerDashboardController],
  providers: [DashboardService, ResourceScopeHelper, AuditService],
  exports: [DashboardService],
})
export class DashboardModule {}
