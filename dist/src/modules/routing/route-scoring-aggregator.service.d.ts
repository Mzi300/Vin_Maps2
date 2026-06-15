import { RuleBasedScoringService } from './rule-based-scoring.service';
import { AIInferenceService } from '../ai/inference/ai-inference.service';
import { WeightUpdaterService } from '../ai/reinforcement/weight-updater.service';
import { RouteCandidate, EvaluatedRoute } from './interfaces/route-candidate.interface';
import { CongestionForecastModel } from '../ai/models/congestion-forecast.model';
import { TemporalPatternModel } from '../ai/models/temporal-pattern.model';
import { AnomalyDetectorService } from '../ai/anomaly/anomaly-detector.service';
import { RouteConfidenceService } from '../ai/confidence/route-confidence.service';
import { ModelArbitrationService } from '../ai/arbitration/model-arbitration.service';
import { RouteExplanationService } from '../ai/explanation/route-explanation.service';
import { AILoadProtectionService } from '../ai/protection/ai-load-protection.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class RouteScoringAggregatorService {
    private readonly ruleBasedService;
    private readonly aiInferenceService;
    private readonly weightUpdater;
    private readonly congestionForecastModel;
    private readonly temporalPatternModel;
    private readonly anomalyDetectorService;
    private readonly routeConfidenceService;
    private readonly modelArbitrationService;
    private readonly routeExplanationService;
    private readonly aiLoadProtectionService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(ruleBasedService: RuleBasedScoringService, aiInferenceService: AIInferenceService, weightUpdater: WeightUpdaterService, congestionForecastModel: CongestionForecastModel, temporalPatternModel: TemporalPatternModel, anomalyDetectorService: AnomalyDetectorService, routeConfidenceService: RouteConfidenceService, modelArbitrationService: ModelArbitrationService, routeExplanationService: RouteExplanationService, aiLoadProtectionService: AILoadProtectionService, eventEmitter: EventEmitter2);
    evaluateRoute(candidate: RouteCandidate, userId: number): Promise<EvaluatedRoute>;
}
