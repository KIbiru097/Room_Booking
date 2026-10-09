import { Module } from '@nestjs/common';
import { ResourceScopeHelper } from '../../common/guards/resource-scope.helper';
import { AuditService } from '../../common/services/audit.service';
import { NavigationService } from './application/navigation.service';
import { ManagerNavigationController } from './presentation/manager-navigation.controller';

@Module({
  controllers: [ManagerNavigationController],
  providers: [NavigationService, ResourceScopeHelper, AuditService],
  exports: [NavigationService],
})
export class NavigationModule {}
