import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [TelemetryModule, IncidentsModule],
  controllers: [HealthController],
})
export class HealthModule {}
