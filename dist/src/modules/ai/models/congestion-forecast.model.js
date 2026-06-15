"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CongestionForecastModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CongestionForecastModel = void 0;
const common_1 = require("@nestjs/common");
let CongestionForecastModel = CongestionForecastModel_1 = class CongestionForecastModel {
    logger = new common_1.Logger(CongestionForecastModel_1.name);
    async predictFutureCongestion(clusterId, currentDensity, historicalTrend, rlWeight) {
        let probability = (currentDensity / 100) + (historicalTrend * 0.05) + rlWeight;
        if (probability < 0)
            probability = 0;
        if (probability > 1)
            probability = 1;
        let level = 'LOW';
        if (probability > 0.8)
            level = 'CRITICAL';
        else if (probability > 0.6)
            level = 'HIGH';
        else if (probability > 0.4)
            level = 'MEDIUM';
        return {
            clusterId,
            congestionProbability: parseFloat(probability.toFixed(2)),
            predictedLevel: level,
            timeHorizon: '15m'
        };
    }
};
exports.CongestionForecastModel = CongestionForecastModel;
exports.CongestionForecastModel = CongestionForecastModel = CongestionForecastModel_1 = __decorate([
    (0, common_1.Injectable)()
], CongestionForecastModel);
//# sourceMappingURL=congestion-forecast.model.js.map