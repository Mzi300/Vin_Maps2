import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteUsageLog } from './learning/route-usage-log.entity';
import { FeatureBuilderService } from './features/feature-builder.service';
import { OutcomeTrackerService } from './learning/outcome-tracker.service';
import { EtaModelService } from './models/eta-model.service';
import { CongestionModelService } from './models/congestion-model.service';
import { WeightUpdaterService } from './reinforcement/weight-updater.service';
import { AIInferenceService } from './inference/ai-inference.service';
import { AiController } from './ai.controller';
import { CongestionForecastModel } from './models/congestion-forecast.model';
import { TemporalPatternModel } from './models/temporal-pattern.model';
import { AnomalyDetectorService } from './anomaly/anomaly-detector.service';
import { RouteConfidenceService } from './confidence/route-confidence.service';
import { ModelEvaluationLog } from './evaluation/model-evaluation-log.entity';
import { EvaluationListener } from './evaluation/evaluation.listener';
import { ModelArbitrationService } from './arbitration/model-arbitration.service';
import { RouteExplanationService } from './explanation/route-explanation.service';
import { AILoadProtectionService } from './protection/ai-load-protection.service';

@Module({
  imports: [TypeOrmModule.forFeature([RouteUsageLog, ModelEvaluationLog])],
  controllers: [AiController],
  providers: [
    FeatureBuilderService, 
    OutcomeTrackerService,
    EtaModelService,
    CongestionModelService,
    WeightUpdaterService,
    AIInferenceService,
    CongestionForecastModel,
    TemporalPatternModel,
    AnomalyDetectorService,
    RouteConfidenceService,
    EvaluationListener,
    ModelArbitrationService,
    RouteExplanationService,
    AILoadProtectionService
  ],
  exports: [
    OutcomeTrackerService, 
    AIInferenceService, 
    WeightUpdaterService,
    CongestionForecastModel,
    TemporalPatternModel,
    AnomalyDetectorService,
    RouteConfidenceService,
    ModelArbitrationService,
    RouteExplanationService,
    AILoadProtectionService
  ],
})
export class AiModule {}
