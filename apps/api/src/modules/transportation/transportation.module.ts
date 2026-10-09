import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PartnerTransportService } from './application/partner-transport.service';
import { TransportationService } from './application/transportation.service';
import { PartnerTransportController } from './presentation/partner-transport.controller';
import { TransportationController } from './presentation/transportation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TransportationController, PartnerTransportController],
  providers: [TransportationService, PartnerTransportService],
  exports: [TransportationService, PartnerTransportService],
})
export class TransportationModule {}
