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
exports.DriverSession = void 0;
const typeorm_1 = require("typeorm");
let DriverSession = class DriverSession {
    id;
    operator_id;
    safety_score;
    hard_braking_events;
    potholes_detected;
    total_distance;
    started_at;
    updated_at;
};
exports.DriverSession = DriverSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DriverSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverSession.prototype, "operator_id", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 100 }),
    __metadata("design:type", Number)
], DriverSession.prototype, "safety_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DriverSession.prototype, "hard_braking_events", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DriverSession.prototype, "potholes_detected", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { default: 0 }),
    __metadata("design:type", Number)
], DriverSession.prototype, "total_distance", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverSession.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DriverSession.prototype, "updated_at", void 0);
exports.DriverSession = DriverSession = __decorate([
    (0, typeorm_1.Entity)('driver_sessions')
], DriverSession);
//# sourceMappingURL=driver-session.entity.js.map