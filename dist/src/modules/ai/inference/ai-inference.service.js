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
var AIInferenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIInferenceService = void 0;
const common_1 = require("@nestjs/common");
let AIInferenceService = AIInferenceService_1 = class AIInferenceService {
    logger = new common_1.Logger(AIInferenceService_1.name);
    constructor() { }
    calculateMLAdjustment(tripData) {
        let mlAdjustment = 0;
        const hours = tripData.startTime?.getHours() || 12;
        const dayOfWeek = tripData.startTime?.getDay() || 1;
        const isRushHour = (hours >= 7 && hours <= 9) ||
            (hours >= 16 && hours <= 18);
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        if (isWeekday && isRushHour) {
            mlAdjustment -= 5;
            this.logger.debug('AI Model applied temporal rush hour penalty.');
        }
        if (tripData.incidentCount > 1) {
            mlAdjustment -= (tripData.incidentCount * 2);
        }
        if (tripData.distanceKm > 10 && tripData.avgTrafficLevel < 1) {
            mlAdjustment += 3;
        }
        return mlAdjustment;
    }
};
exports.AIInferenceService = AIInferenceService;
exports.AIInferenceService = AIInferenceService = AIInferenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIInferenceService);
//# sourceMappingURL=ai-inference.service.js.map