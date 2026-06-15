"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureBuilderService = void 0;
const common_1 = require("@nestjs/common");
let FeatureBuilderService = class FeatureBuilderService {
    buildFeatures(log) {
        const hours = log.startTime?.getHours() || new Date().getHours();
        const dayOfWeek = log.startTime?.getDay() || new Date().getDay();
        const incidentCount = log.actualEvents ? log.actualEvents.length : 0;
        const avgTrafficLevel = log.routeScoreInputs?.avgTrafficLevel || 0;
        const safetyZoneExposure = log.routeScoreInputs?.safetyZoneExposure || 0;
        return {
            distanceKm: log.distanceKm,
            avgTrafficLevel,
            incidentCount,
            safetyZoneExposure,
            timeOfDay: hours,
            dayOfWeek: dayOfWeek,
        };
    }
};
exports.FeatureBuilderService = FeatureBuilderService;
exports.FeatureBuilderService = FeatureBuilderService = __decorate([
    (0, common_1.Injectable)()
], FeatureBuilderService);
//# sourceMappingURL=feature-builder.service.js.map