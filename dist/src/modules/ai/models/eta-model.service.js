"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EtaModelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtaModelService = void 0;
const common_1 = require("@nestjs/common");
let EtaModelService = EtaModelService_1 = class EtaModelService {
    logger = new common_1.Logger(EtaModelService_1.name);
    globalEtaBias = 0.0;
    calculateLearnedBias(features) {
        let bias = this.globalEtaBias;
        if (features.timeOfDay >= 16 && features.timeOfDay <= 18 && features.dayOfWeek >= 1 && features.dayOfWeek <= 5) {
            bias += 4;
        }
        if (features.incidentCount > 0) {
            bias += (features.incidentCount * 2);
        }
        return bias;
    }
    updateBias(etaError) {
        this.globalEtaBias += etaError * 0.1;
    }
    getGlobalBias() {
        return this.globalEtaBias;
    }
};
exports.EtaModelService = EtaModelService;
exports.EtaModelService = EtaModelService = EtaModelService_1 = __decorate([
    (0, common_1.Injectable)()
], EtaModelService);
//# sourceMappingURL=eta-model.service.js.map