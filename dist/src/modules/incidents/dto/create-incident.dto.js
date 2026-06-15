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
exports.CreateIncidentDto = exports.IncidentSeverity = exports.IncidentType = void 0;
const class_validator_1 = require("class-validator");
var IncidentType;
(function (IncidentType) {
    IncidentType["POTHOLE"] = "POTHOLE";
    IncidentType["ACCIDENT"] = "ACCIDENT";
    IncidentType["ROAD_HAZARD"] = "ROAD_HAZARD";
    IncidentType["ROAD_CLOSURE"] = "ROAD_CLOSURE";
    IncidentType["FLOOD"] = "FLOOD";
    IncidentType["BROKEN_TRAFFIC_LIGHT"] = "BROKEN_TRAFFIC_LIGHT";
    IncidentType["POLICE_CHECKPOINT"] = "POLICE_CHECKPOINT";
    IncidentType["CONSTRUCTION"] = "CONSTRUCTION";
})(IncidentType || (exports.IncidentType = IncidentType = {}));
var IncidentSeverity;
(function (IncidentSeverity) {
    IncidentSeverity["LOW"] = "LOW";
    IncidentSeverity["MEDIUM"] = "MEDIUM";
    IncidentSeverity["HIGH"] = "HIGH";
    IncidentSeverity["CRITICAL"] = "CRITICAL";
})(IncidentSeverity || (exports.IncidentSeverity = IncidentSeverity = {}));
class CreateIncidentDto {
    type;
    severity;
    latitude;
    longitude;
    description;
    mediaUrl;
}
exports.CreateIncidentDto = CreateIncidentDto;
__decorate([
    (0, class_validator_1.IsEnum)(IncidentType),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(IncidentSeverity),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "mediaUrl", void 0);
//# sourceMappingURL=create-incident.dto.js.map