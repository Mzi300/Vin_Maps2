"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ModelArbitrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelArbitrationService = void 0;
const common_1 = require("@nestjs/common");
let ModelArbitrationService = ModelArbitrationService_1 = class ModelArbitrationService {
    logger = new common_1.Logger(ModelArbitrationService_1.name);
    arbitrate(input) {
        const normalizedRule = Math.max(0, Math.min(100, input.ruleScore));
        const normalizedRl = input.rlBias * 100;
        let congestionPenalty = 0;
        if (input.congestionLevel === 'CRITICAL')
            congestionPenalty = -20;
        else if (input.congestionLevel === 'HIGH')
            congestionPenalty = -10;
        else if (input.congestionLevel === 'MEDIUM')
            congestionPenalty = -5;
        const temporalPenalty = -(input.temporalRiskScore * 0.5);
        const anomalyPenalty = input.hasAnomaly ? -30 : 0;
        const normalizedMl = Math.max(-20, Math.min(20, input.mlScore));
        const c = input.confidenceScore;
        let wRule = 0.5 + ((1 - c) * 0.5);
        let wRl = 0.2 * c;
        let wMl = 0.2 * c;
        let wCongestion = 0.3 * c;
        let wTemporal = 0.2 * c;
        let wAnomaly = 0.5;
        let totalWeight = wRule + Math.abs(wRl) + Math.abs(wMl) + wCongestion + wTemporal + wAnomaly;
        wRule /= totalWeight;
        wRl /= totalWeight;
        wMl /= totalWeight;
        wCongestion /= totalWeight;
        wTemporal /= totalWeight;
        wAnomaly /= totalWeight;
        wRule = Math.min(wRule, 0.6);
        wRl = Math.min(wRl, 0.6);
        wMl = Math.min(wMl, 0.6);
        wCongestion = Math.min(wCongestion, 0.6);
        wTemporal = Math.min(wTemporal, 0.6);
        wAnomaly = Math.min(wAnomaly, 0.6);
        let finalScore = (normalizedRule * wRule) +
            (normalizedRule + normalizedRl) * wRl +
            (normalizedRule + normalizedMl) * wMl +
            (normalizedRule + congestionPenalty) * wCongestion +
            (normalizedRule + temporalPenalty) * wTemporal +
            (normalizedRule + anomalyPenalty) * wAnomaly;
        if (finalScore < 0)
            finalScore = 0;
        if (finalScore > 100)
            finalScore = 100;
        const impacts = {
            RuleBase: wRule,
            RL: wRl,
            ML: wMl,
            Congestion: wCongestion,
            Temporal: wTemporal,
            Anomaly: wAnomaly
        };
        const dominantFactor = Object.keys(impacts).reduce((a, b) => impacts[a] > impacts[b] ? a : b);
        return {
            finalScore: parseFloat(finalScore.toFixed(2)),
            weights: {
                RuleBase: parseFloat(wRule.toFixed(2)),
                RL: parseFloat(wRl.toFixed(2)),
                ML: parseFloat(wMl.toFixed(2)),
                Congestion: parseFloat(wCongestion.toFixed(2)),
                Temporal: parseFloat(wTemporal.toFixed(2)),
                Anomaly: parseFloat(wAnomaly.toFixed(2))
            },
            dominantFactor
        };
    }
};
exports.ModelArbitrationService = ModelArbitrationService;
exports.ModelArbitrationService = ModelArbitrationService = ModelArbitrationService_1 = __decorate([
    (0, common_1.Injectable)()
], ModelArbitrationService);
//# sourceMappingURL=model-arbitration.service.js.map