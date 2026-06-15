"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RouteScoringAggregatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteScoringAggregatorService = void 0;
const common_1 = require("@nestjs/common");
const rule_based_scoring_service_1 = require("./rule-based-scoring.service");
const ai_inference_service_1 = require("../ai/inference/ai-inference.service");
const weight_updater_service_1 = require("../ai/reinforcement/weight-updater.service");
const congestion_forecast_model_1 = require("../ai/models/congestion-forecast.model");
const temporal_pattern_model_1 = require("../ai/models/temporal-pattern.model");
const anomaly_detector_service_1 = require("../ai/anomaly/anomaly-detector.service");
const route_confidence_service_1 = require("../ai/confidence/route-confidence.service");
const model_arbitration_service_1 = require("../ai/arbitration/model-arbitration.service");
const route_explanation_service_1 = require("../ai/explanation/route-explanation.service");
const ai_load_protection_service_1 = require("../ai/protection/ai-load-protection.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let RouteScoringAggregatorService = RouteScoringAggregatorService_1 = class RouteScoringAggregatorService {
    ruleBasedService;
    aiInferenceService;
    weightUpdater;
    congestionForecastModel;
    temporalPatternModel;
    anomalyDetectorService;
    routeConfidenceService;
    modelArbitrationService;
    routeExplanationService;
    aiLoadProtectionService;
    eventEmitter;
    logger = new common_1.Logger(RouteScoringAggregatorService_1.name);
    constructor(ruleBasedService, aiInferenceService, weightUpdater, congestionForecastModel, temporalPatternModel, anomalyDetectorService, routeConfidenceService, modelArbitrationService, routeExplanationService, aiLoadProtectionService, eventEmitter) {
        this.ruleBasedService = ruleBasedService;
        this.aiInferenceService = aiInferenceService;
        this.weightUpdater = weightUpdater;
        this.congestionForecastModel = congestionForecastModel;
        this.temporalPatternModel = temporalPatternModel;
        this.anomalyDetectorService = anomalyDetectorService;
        this.routeConfidenceService = routeConfidenceService;
        this.modelArbitrationService = modelArbitrationService;
        this.routeExplanationService = routeExplanationService;
        this.aiLoadProtectionService = aiLoadProtectionService;
        this.eventEmitter = eventEmitter;
    }
    async evaluateRoute(candidate, userId) {
        const ruleResult = await this.ruleBasedService.evaluateCandidate(candidate, userId);
        let finalScore = ruleResult.score;
        let mlScore = 0;
        let confidenceOutput = { confidenceScore: 0, uncertaintyFactors: [] };
        let congestionForecast = { predictedLevel: 'LOW' };
        let explanation = 'System operating in degraded mode. Route determined purely by deterministic safety rules.';
        let arbitrationDetails = null;
        let systemMode = 'NORMAL';
        try {
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
                const confOut = await this.routeConfidenceService.calculateConfidence(candidate.id, ruleResult.score, mlScore, hasAnomaly, temporalPattern.deviationRiskScore);
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
                this.eventEmitter.emit('route.evaluated', {
                    routeId: candidate.id,
                    predictedEta: (candidate.distanceKm / 60) * 60 + ruleResult.penalty * 0.5 - (mlScore * 0.2),
                    congestionPrediction: congestionForecast,
                    anomalyFlags: confidenceOutput.uncertaintyFactors,
                    finalScore: finalScore
                });
            });
        }
        catch (e) {
            this.logger.error(`AI System Failed for route ${candidate.id}. Falling back to RuleBased. Reason: ${e.message}`);
            systemMode = 'DEGRADED';
        }
        let riskLevel = 'LOW';
        if (finalScore < 50)
            riskLevel = 'CRITICAL';
        else if (finalScore < 70)
            riskLevel = 'HIGH';
        else if (finalScore < 85)
            riskLevel = 'MEDIUM';
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
};
exports.RouteScoringAggregatorService = RouteScoringAggregatorService;
exports.RouteScoringAggregatorService = RouteScoringAggregatorService = RouteScoringAggregatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rule_based_scoring_service_1.RuleBasedScoringService,
        ai_inference_service_1.AIInferenceService,
        weight_updater_service_1.WeightUpdaterService,
        congestion_forecast_model_1.CongestionForecastModel,
        temporal_pattern_model_1.TemporalPatternModel,
        anomaly_detector_service_1.AnomalyDetectorService,
        route_confidence_service_1.RouteConfidenceService,
        model_arbitration_service_1.ModelArbitrationService,
        route_explanation_service_1.RouteExplanationService,
        ai_load_protection_service_1.AILoadProtectionService,
        event_emitter_1.EventEmitter2])
], RouteScoringAggregatorService);
//# sourceMappingURL=route-scoring-aggregator.service.js.map