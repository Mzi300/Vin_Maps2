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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OutcomeTrackerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomeTrackerService = exports.TripCompletionPayload = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const route_usage_log_entity_1 = require("./route-usage-log.entity");
const weight_updater_service_1 = require("../reinforcement/weight-updater.service");
const eta_model_service_1 = require("../models/eta-model.service");
class TripCompletionPayload {
    routeId;
    userId;
    startTime;
    endTime;
    distanceKm;
    predictedEtaMinutes;
    predictedSafetyScore;
    actualEvents;
    congestionLevel;
    routeScoreInputs;
}
exports.TripCompletionPayload = TripCompletionPayload;
let OutcomeTrackerService = OutcomeTrackerService_1 = class OutcomeTrackerService {
    routeUsageLogRepo;
    weightUpdater;
    etaModel;
    logger = new common_1.Logger(OutcomeTrackerService_1.name);
    constructor(routeUsageLogRepo, weightUpdater, etaModel) {
        this.routeUsageLogRepo = routeUsageLogRepo;
        this.weightUpdater = weightUpdater;
        this.etaModel = etaModel;
    }
    async finalizeTrip(payload) {
        const actualEtaMinutes = Math.max(1, Math.round((new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000));
        const etaError = actualEtaMinutes - payload.predictedEtaMinutes;
        const safetyPenalty = payload.predictedSafetyScore < 85 ? 10 : 0;
        this.weightUpdater.applyReward(etaError, safetyPenalty, 0);
        this.etaModel.updateBias(etaError);
        const log = this.routeUsageLogRepo.create({
            ...payload,
            actualEtaMinutes,
            ruleBasedScore: payload.routeScoreInputs?.ruleBasedScore || payload.predictedSafetyScore,
            mlAdjustmentScore: payload.routeScoreInputs?.mlScore || 0,
        });
        await this.routeUsageLogRepo.save(log);
        this.logger.log(`Trip finalized [${payload.routeId}]. Actual ETA: ${actualEtaMinutes}m (Error: ${etaError > 0 ? '+' : ''}${etaError}m). Ground truth saved.`);
        return log;
    }
};
exports.OutcomeTrackerService = OutcomeTrackerService;
exports.OutcomeTrackerService = OutcomeTrackerService = OutcomeTrackerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(route_usage_log_entity_1.RouteUsageLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        weight_updater_service_1.WeightUpdaterService,
        eta_model_service_1.EtaModelService])
], OutcomeTrackerService);
//# sourceMappingURL=outcome-tracker.service.js.map