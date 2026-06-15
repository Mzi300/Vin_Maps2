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
exports.RouteUsageLog = void 0;
const typeorm_1 = require("typeorm");
let RouteUsageLog = class RouteUsageLog {
    id;
    userId;
    routeId;
    startTime;
    endTime;
    distanceKm;
    predictedEtaMinutes;
    actualEtaMinutes;
    ruleBasedScore;
    mlAdjustmentScore;
    efficiencyScore;
    predictedSafetyScore;
    features;
    actualEvents;
    congestionLevel;
    routeScoreInputs;
    timestamp;
};
exports.RouteUsageLog = RouteUsageLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RouteUsageLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], RouteUsageLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], RouteUsageLog.prototype, "routeId", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamp', { nullable: true }),
    __metadata("design:type", Date)
], RouteUsageLog.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamp', { nullable: true }),
    __metadata("design:type", Date)
], RouteUsageLog.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "distanceKm", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "predictedEtaMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "actualEtaMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "ruleBasedScore", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "mlAdjustmentScore", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "efficiencyScore", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "predictedSafetyScore", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], RouteUsageLog.prototype, "features", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], RouteUsageLog.prototype, "actualEvents", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], RouteUsageLog.prototype, "congestionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], RouteUsageLog.prototype, "routeScoreInputs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], RouteUsageLog.prototype, "timestamp", void 0);
exports.RouteUsageLog = RouteUsageLog = __decorate([
    (0, typeorm_1.Entity)('route_usage_logs')
], RouteUsageLog);
//# sourceMappingURL=route-usage-log.entity.js.map