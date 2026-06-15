"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CongestionModelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CongestionModelService = void 0;
const common_1 = require("@nestjs/common");
let CongestionModelService = CongestionModelService_1 = class CongestionModelService {
    logger = new common_1.Logger(CongestionModelService_1.name);
    predictCongestionProbability(features) {
        let score = 0;
        score += (features.incidentCount * 0.3);
        score += (features.avgTrafficLevel * 0.4);
        if (features.timeOfDay >= 16 && features.timeOfDay <= 18) {
            score += 0.2;
        }
        return Math.min(Math.max(score, 0), 1);
    }
};
exports.CongestionModelService = CongestionModelService;
exports.CongestionModelService = CongestionModelService = CongestionModelService_1 = __decorate([
    (0, common_1.Injectable)()
], CongestionModelService);
//# sourceMappingURL=congestion-model.service.js.map