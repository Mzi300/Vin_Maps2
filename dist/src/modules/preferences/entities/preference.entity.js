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
exports.Preference = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let Preference = class Preference {
    id;
    user;
    avoidTolls;
    preferredSpeedKmh;
    vehicleType;
};
exports.Preference = Preference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Preference.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.preferences, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], Preference.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Preference.prototype, "avoidTolls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 80 }),
    __metadata("design:type", Number)
], Preference.prototype, "preferredSpeedKmh", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['car', 'truck', 'motorcycle'], default: 'car' }),
    __metadata("design:type", String)
], Preference.prototype, "vehicleType", void 0);
exports.Preference = Preference = __decorate([
    (0, typeorm_1.Entity)()
], Preference);
//# sourceMappingURL=preference.entity.js.map