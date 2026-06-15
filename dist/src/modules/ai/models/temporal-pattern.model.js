"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalPatternModel = void 0;
const common_1 = require("@nestjs/common");
let TemporalPatternModel = class TemporalPatternModel {
    async getPatternForTime(date) {
        const hours = date.getHours();
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;
        let multiplier = 1.0;
        let riskScore = 0;
        let slot = 'NORMAL';
        if (!isWeekend) {
            if (hours >= 7 && hours <= 9) {
                slot = 'MORNING_RUSH';
                multiplier = 1.4;
                riskScore = 15;
            }
            else if (hours >= 16 && hours <= 18) {
                slot = 'EVENING_RUSH';
                multiplier = 1.5;
                riskScore = 20;
            }
        }
        else {
            if (hours >= 12 && hours <= 15) {
                slot = 'WEEKEND_MIDDAY';
                multiplier = 1.2;
                riskScore = 5;
            }
        }
        return {
            timeSlot: slot,
            expectedTrafficMultiplier: multiplier,
            deviationRiskScore: riskScore
        };
    }
};
exports.TemporalPatternModel = TemporalPatternModel;
exports.TemporalPatternModel = TemporalPatternModel = __decorate([
    (0, common_1.Injectable)()
], TemporalPatternModel);
//# sourceMappingURL=temporal-pattern.model.js.map