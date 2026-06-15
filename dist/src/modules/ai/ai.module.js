"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const route_usage_log_entity_1 = require("./learning/route-usage-log.entity");
const feature_builder_service_1 = require("./features/feature-builder.service");
const outcome_tracker_service_1 = require("./learning/outcome-tracker.service");
const eta_model_service_1 = require("./models/eta-model.service");
const congestion_model_service_1 = require("./models/congestion-model.service");
const weight_updater_service_1 = require("./reinforcement/weight-updater.service");
const ai_inference_service_1 = require("./inference/ai-inference.service");
const ai_controller_1 = require("./ai.controller");
const congestion_forecast_model_1 = require("./models/congestion-forecast.model");
const temporal_pattern_model_1 = require("./models/temporal-pattern.model");
const anomaly_detector_service_1 = require("./anomaly/anomaly-detector.service");
const route_confidence_service_1 = require("./confidence/route-confidence.service");
const model_evaluation_log_entity_1 = require("./evaluation/model-evaluation-log.entity");
const evaluation_listener_1 = require("./evaluation/evaluation.listener");
const model_arbitration_service_1 = require("./arbitration/model-arbitration.service");
const route_explanation_service_1 = require("./explanation/route-explanation.service");
const ai_load_protection_service_1 = require("./protection/ai-load-protection.service");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([route_usage_log_entity_1.RouteUsageLog, model_evaluation_log_entity_1.ModelEvaluationLog])],
        controllers: [ai_controller_1.AiController],
        providers: [
            feature_builder_service_1.FeatureBuilderService,
            outcome_tracker_service_1.OutcomeTrackerService,
            eta_model_service_1.EtaModelService,
            congestion_model_service_1.CongestionModelService,
            weight_updater_service_1.WeightUpdaterService,
            ai_inference_service_1.AIInferenceService,
            congestion_forecast_model_1.CongestionForecastModel,
            temporal_pattern_model_1.TemporalPatternModel,
            anomaly_detector_service_1.AnomalyDetectorService,
            route_confidence_service_1.RouteConfidenceService,
            evaluation_listener_1.EvaluationListener,
            model_arbitration_service_1.ModelArbitrationService,
            route_explanation_service_1.RouteExplanationService,
            ai_load_protection_service_1.AILoadProtectionService
        ],
        exports: [
            outcome_tracker_service_1.OutcomeTrackerService,
            ai_inference_service_1.AIInferenceService,
            weight_updater_service_1.WeightUpdaterService,
            congestion_forecast_model_1.CongestionForecastModel,
            temporal_pattern_model_1.TemporalPatternModel,
            anomaly_detector_service_1.AnomalyDetectorService,
            route_confidence_service_1.RouteConfidenceService,
            model_arbitration_service_1.ModelArbitrationService,
            route_explanation_service_1.RouteExplanationService,
            ai_load_protection_service_1.AILoadProtectionService
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map