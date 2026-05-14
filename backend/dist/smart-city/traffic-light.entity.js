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
exports.TrafficLight = void 0;
const typeorm_1 = require("typeorm");
let TrafficLight = class TrafficLight {
    id;
    location;
    current_state;
    time_remaining;
    updated_at;
};
exports.TrafficLight = TrafficLight;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrafficLight.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('geometry', {
        spatialFeatureType: 'Point',
        srid: 4326,
    }),
    __metadata("design:type", Object)
], TrafficLight.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'unknown' }),
    __metadata("design:type", String)
], TrafficLight.prototype, "current_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], TrafficLight.prototype, "time_remaining", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TrafficLight.prototype, "updated_at", void 0);
exports.TrafficLight = TrafficLight = __decorate([
    (0, typeorm_1.Entity)('traffic_lights')
], TrafficLight);
//# sourceMappingURL=traffic-light.entity.js.map