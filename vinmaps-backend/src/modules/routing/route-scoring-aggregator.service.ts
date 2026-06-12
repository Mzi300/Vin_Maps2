import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class RouteScoringAggregatorService {
  private readonly logger = new Logger(RouteScoringAggregatorService.name);

  constructor(
    private readonly ruleBasedService: RuleBasedScoringService,
    private readonly aiInferenceService: AIInferenceService,
    private readonly weightUpdater: WeightUpdaterService,
    private readonly congestionForecastModel: CongestionForecastModel,
    private readonly temporalPatternModel: TemporalPatternModel,
    private readonly anomalyDetectorService: AnomalyDetectorService,
    private readonly routeConfidenceService: RouteConfidenceService,
    private readonly modelArbitrationService: ModelArbitrationService,
    private readonly routeExplanationService: RouteExplanationService,
    private readonly aiLoadProtectionService: AILoadProtectionService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async evaluateRoute(candidate: RouteCandidate): Promise<EvaluatedRoute> {
    // 1. Core Rule Engine (Always Execute)
    const ruleResult = await this.ruleBasedService.evaluateCandidate(candidate);

    // Default Fallback State
    let finalScore = ruleResult.score;
    let mlScore = 0;
    let confidenceOutput = { confidenceScore: 0, uncertaintyFactors: [] as string[] };
    let congestionForecast = { predictedLevel: 'LOW' as any };
    let explanation = 'System operating in degraded mode. Route determined purely by deterministic safety rules.';
    let arbitrationDetails: any = null;
    let systemMode: 'NORMAL' | 'DEGRADED' = 'NORMAL';

    try {
      // Execute all ML systems inside the Load Protection Circuit Breaker
      await this.aiLoadProtectionService.executeProtected(async () => {
        const avgTrafficLevel = ruleResult.trafficHitCount > 0 ? ruleResult.trafficLevelSum / ruleResult.trafficHitCount : 0;
        
        const rawTripData = {
          distanceKm: candidate.distanceKm,
          avgTrafficLevel,
          incidentCount: ruleResult.incidentCount,
          safetyZoneExposure: ruleResult.safetyZoneExposure,
          startTime: new Date()
        };

        mlScore = this.aiInferenceService.calculateMLAdjustment(rawTripData);
        const learnedWeightBias = this.weightUpdater.getLearnedWeightModifier();

        const [forecast, temporalPattern, hasAnomaly] = await Promise.all([
          this.congestionForecastModel.predictFutureCongestion(candidate.id, avgTrafficLevel * 20, 0, learnedWeightBias),
          this.temporalPatternModel.getPatternForTime(new Date()),
          this.anomalyDetectorService.detectAnomaly(avgTrafficLevel * 10, 0, ruleResult.incidentCount)
        ]);

        congestionForecast = forecast;

        const confOut = await this.routeConfidenceService.calculateConfidence(
          candidate.id, ruleResult.score, mlScore, hasAnomaly, temporalPattern.deviationRiskScore
        );
        confidenceOutput = confOut;

        const arbitrationInput = {
          ruleScore: ruleResult.score,
          mlScore: mlScore,
          rlBias: learnedWeightBias,
          congestionLevel: congestionForecast.predictedLevel,
          temporalRiskScore: temporalPattern.deviationRiskScore,
          hasAnomaly: hasAnomaly,
          confidenceScore: confidenceOutput.confidenceScore
        };

        const arbitrationOutput = this.modelArbitrationService.arbitrate(arbitrationInput);
        explanation = this.routeExplanationService.generateExplanation(arbitrationInput, arbitrationOutput);
        finalScore = arbitrationOutput.finalScore;

        arbitrationDetails = {
          weights: arbitrationOutput.weights,
          dominantFactor: arbitrationOutput.dominantFactor,
          confidenceScore: confidenceOutput.confidenceScore
        };

        // Emit Evaluation Log asynchronously (fire-and-forget)
        this.eventEmitter.emit('route.evaluated', {
          routeId: candidate.id,
          predictedEta: (candidate.distanceKm / 60) * 60 + ruleResult.penalty * 0.5 - (mlScore * 0.2),
          congestionPrediction: congestionForecast,
          anomalyFlags: confidenceOutput.uncertaintyFactors,
          finalScore: finalScore
        });
      });
    } catch (e: any) {
      this.logger.error(`AI System Failed for route ${candidate.id}. Falling back to RuleBased. Reason: ${e.message}`);
      systemMode = 'DEGRADED';
    }

    let riskLevel = 'LOW';
    if (finalScore < 50) riskLevel = 'CRITICAL';
    else if (finalScore < 70) riskLevel = 'HIGH';
    else if (finalScore < 85) riskLevel = 'MEDIUM';

    let etaMinutes = (candidate.distanceKm / 60) * 60;
    etaMinutes += ruleResult.penalty * 0.5 - (mlScore * 0.2);

    return {
      routeId: candidate.id,
      distance: parseFloat(candidate.distanceKm.toFixed(2)),
      eta: Math.round(etaMinutes),
      ruleBasedScore: ruleResult.score,
      mlScore: Math.round(mlScore),
      finalScore: Math.round(finalScore),
      riskLevel,
      warnings: ruleResult.warnings,
      confidenceScore: confidenceOutput.confidenceScore,
      anomalyFlags: confidenceOutput.uncertaintyFactors,
      congestionForecast: congestionForecast.predictedLevel,
      explanation,
      arbitrationDetails,
      systemMode
    };
  }
}
