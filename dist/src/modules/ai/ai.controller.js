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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const weight_updater_service_1 = require("./reinforcement/weight-updater.service");
const eta_model_service_1 = require("./models/eta-model.service");
let AiController = class AiController {
    weightUpdater;
    etaModel;
    constructor(weightUpdater, etaModel) {
        this.weightUpdater = weightUpdater;
        this.etaModel = etaModel;
    }
    getModelState() {
        return {
            rl: this.weightUpdater.getModelState(),
            etaGlobalBias: this.etaModel.getGlobalBias()
        };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('debug/model-state'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getModelState", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [weight_updater_service_1.WeightUpdaterService,
        eta_model_service_1.EtaModelService])
], AiController);
//# sourceMappingURL=ai.controller.js.map