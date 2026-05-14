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
exports.Hazard = exports.HazardSeverity = exports.HazardType = void 0;
const typeorm_1 = require("typeorm");
var HazardType;
(function (HazardType) {
    HazardType["POTHOLE"] = "pothole";
    HazardType["ACCIDENT"] = "accident";
    HazardType["FLOODING"] = "flooding";
    HazardType["PROTEST"] = "protest";
    HazardType["ROADBLOCK"] = "roadblock";
    HazardType["HIJACKING_HOTSPOT"] = "hijacking_hotspot";
    HazardType["BROKEN_TRAFFIC_LIGHT"] = "broken_traffic_light";
    HazardType["HEAVY_CONGESTION"] = "heavy_congestion";
    HazardType["POLICE_CHECKPOINT"] = "police_checkpoint";
})(HazardType || (exports.HazardType = HazardType = {}));
var HazardSeverity;
(function (HazardSeverity) {
    HazardSeverity["INFO"] = "info";
    HazardSeverity["WARNING"] = "warning";
    HazardSeverity["CRITICAL"] = "critical";
})(HazardSeverity || (exports.HazardSeverity = HazardSeverity = {}));
let Hazard = class Hazard {
    id;
    type;
    severity;
    confidence_score;
    verified;
    source;
    location;
    expires_at;
    upvotes;
    downvotes;
    created_at;
    updated_at;
};
exports.Hazard = Hazard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Hazard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: HazardType,
    }),
    __metadata("design:type", String)
], Hazard.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: HazardSeverity,
        default: HazardSeverity.INFO,
    }),
    __metadata("design:type", String)
], Hazard.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 0 }),
    __metadata("design:type", Number)
], Hazard.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Hazard.prototype, "verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hazard.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)('geometry', {
        spatialFeatureType: 'Point',
        srid: 4326,
    }),
    __metadata("design:type", Object)
], Hazard.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Hazard.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Hazard.prototype, "upvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Hazard.prototype, "downvotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Hazard.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Hazard.prototype, "updated_at", void 0);
exports.Hazard = Hazard = __decorate([
    (0, typeorm_1.Entity)('hazards')
], Hazard);
//# sourceMappingURL=hazard.entity.js.map