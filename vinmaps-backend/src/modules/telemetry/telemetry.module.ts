import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleTelemetry } from './entities/vehicle-telemetry.entity';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryClusteringService } from './telemetry-clustering.service';
import { TrafficHistoryService } from './traffic-history.service';
import { TrafficPredictionService } from './traffic-prediction.service';
import { SafetyZonesModule } from '../safety-zones/safety-zones.module';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleTelemetry]), SafetyZonesModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryGateway, TelemetryClusteringService, TrafficHistoryService, TrafficPredictionService],
  exports: [TelemetryService, TelemetryGateway, TelemetryClusteringService, TrafficHistoryService, TrafficPredictionService],
})
export class TelemetryModule {}
