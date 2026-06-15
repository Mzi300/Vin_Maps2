"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WeightUpdaterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightUpdaterService = void 0;
const common_1 = require("@nestjs/common");
let WeightUpdaterService = WeightUpdaterService_1 = class WeightUpdaterService {
    logger = new common_1.Logger(WeightUpdaterService_1.name);
    currentWeightBias = 0.0;
    lastErrors = [];
    totalUpdates = 0;
    getLearnedWeightModifier() {
        return this.currentWeightBias;
    }
    applyReward(etaError, safetyPenalty, rerouteFrequency) {
        this.totalUpdates++;
        this.lastErrors.push(etaError);
        if (this.lastErrors.length > 20)
            this.lastErrors.shift();
        let reward = 0;
        const absError = Math.abs(etaError);
        if (absError <= 2 && safetyPenalty === 0 && rerouteFrequency === 0) {
            reward = 0.5;
        }
        else {
            reward = -(absError * 0.1 + safetyPenalty + rerouteFrequency);
        }
        const alpha = 0.01;
        this.currentWeightBias += (reward * alpha);
        this.currentWeightBias *= 0.99;
        if (this.currentWeightBias > 0.2)
            this.currentWeightBias = 0.2;
        if (this.currentWeightBias < -0.2)
            this.currentWeightBias = -0.2;
        this.logger.debug(`Reinforcement Weight updated. New Bias: ${this.currentWeightBias.toFixed(3)}`);
    }
    getModelState() {
        return {
            currentWeightBias: this.currentWeightBias,
            totalUpdates: this.totalUpdates,
            last20EtaErrors: this.lastErrors,
            averageRecentError: this.lastErrors.length > 0 ? this.lastErrors.reduce((a, b) => a + Math.abs(b), 0) / this.lastErrors.length : 0,
            stability: (this.currentWeightBias >= 0.2 || this.currentWeightBias <= -0.2) ? 'SATURATED' : 'STABLE'
        };
    }
};
exports.WeightUpdaterService = WeightUpdaterService;
exports.WeightUpdaterService = WeightUpdaterService = WeightUpdaterService_1 = __decorate([
    (0, common_1.Injectable)()
], WeightUpdaterService);
//# sourceMappingURL=weight-updater.service.js.map