"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteConfidenceService = void 0;
const common_1 = require("@nestjs/common");
let RouteConfidenceService = class RouteConfidenceService {
    async calculateConfidence(routeId, ruleScore, mlScore, hasAnomaly, temporalRisk) {
        let confidence = 1.0;
        const factors = [];
        if (ruleScore > 80 && mlScore < -10) {
            confidence -= 0.2;
            factors.push('MODEL_DISAGREEMENT');
        }
        if (hasAnomaly) {
            confidence -= 0.4;
            factors.push('ACTIVE_ANOMALY');
        }
        if (temporalRisk > 10) {
            confidence -= (temporalRisk / 100);
            factors.push('HIGH_TEMPORAL_VOLATILITY');
        }
        if (confidence < 0)
            confidence = 0.1;
        return {
            routeId,
            confidenceScore: parseFloat(confidence.toFixed(2)),
            uncertaintyFactors: factors
        };
    }
};
exports.RouteConfidenceService = RouteConfidenceService;
exports.RouteConfidenceService = RouteConfidenceService = __decorate([
    (0, common_1.Injectable)()
], RouteConfidenceService);
//# sourceMappingURL=route-confidence.service.js.map