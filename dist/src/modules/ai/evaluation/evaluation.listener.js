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
var EvaluationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const model_evaluation_log_entity_1 = require("./model-evaluation-log.entity");
let EvaluationListener = EvaluationListener_1 = class EvaluationListener {
    evaluationLogRepo;
    logger = new common_1.Logger(EvaluationListener_1.name);
    constructor(evaluationLogRepo) {
        this.evaluationLogRepo = evaluationLogRepo;
    }
    async handleRouteEvaluatedEvent(payload) {
        try {
            const log = this.evaluationLogRepo.create({
                routeId: payload.routeId,
                predictedEta: payload.predictedEta,
                congestionPrediction: payload.congestionPrediction,
                anomalyFlags: payload.anomalyFlags,
                finalScore: payload.finalScore,
            });
            await this.evaluationLogRepo.save(log);
            this.logger.debug(`Async evaluation log saved for route ${payload.routeId}`);
        }
        catch (e) {
            this.logger.error(`Failed to save ModelEvaluationLog: ${e.message}`);
        }
    }
};
exports.EvaluationListener = EvaluationListener;
__decorate([
    (0, event_emitter_1.OnEvent)('route.evaluated', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvaluationListener.prototype, "handleRouteEvaluatedEvent", null);
exports.EvaluationListener = EvaluationListener = EvaluationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(model_evaluation_log_entity_1.ModelEvaluationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EvaluationListener);
//# sourceMappingURL=evaluation.listener.js.map