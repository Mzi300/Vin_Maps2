"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteExplanationService = void 0;
const common_1 = require("@nestjs/common");
let RouteExplanationService = class RouteExplanationService {
    generateExplanation(input, output) {
        if (input.hasAnomaly) {
            return "Route selected with caution due to active traffic anomaly. Safely capped by arbitration limits.";
        }
        if (input.confidenceScore < 0.5) {
            return "High uncertainty detected; ML models downgraded. Rule-based engine prioritized.";
        }
        if (output.dominantFactor === 'Congestion' && input.congestionLevel !== 'LOW') {
            return `Congestion forecast predicts worsening traffic. Score penalized.`;
        }
        if (output.dominantFactor === 'Temporal') {
            return "Temporal patterns heavily influenced this route (e.g. rush hour optimization).";
        }
        if (output.dominantFactor === 'RL') {
            return "Historical reinforcement learning corrections were the primary driver for this route.";
        }
        if (input.ruleScore > 80) {
            return "Route selected due to stable traffic conditions and high rule-based safety.";
        }
        return "Route generated via balanced multi-model arbitration.";
    }
};
exports.RouteExplanationService = RouteExplanationService;
exports.RouteExplanationService = RouteExplanationService = __decorate([
    (0, common_1.Injectable)()
], RouteExplanationService);
//# sourceMappingURL=route-explanation.service.js.map