import { Module } from '@nestjs/common';
import { RouteIntelligenceService } from './route-intelligence.service';
import { RuleBasedScoringService } from './rule-based-scoring.service';
import { RouteScoringAggregatorService } from './route-scoring-aggregator.service';
import { RoutingController } from './routing.controller';
import { IncidentsModule } from '../incidents/incidents.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { SafetyZonesModule } from '../safety-zones/safety-zones.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [IncidentsModule, TelemetryModule, SafetyZonesModule, AiModule],
  controllers: [RoutingController],
  providers: [RuleBasedScoringService, RouteScoringAggregatorService, RouteIntelligenceService],
  exports: [RouteIntelligenceService],
})
export class RoutingModule {}
