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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyZonesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const safety_zone_entity_1 = require("./entities/safety-zone.entity");
const geo_service_1 = require("../geo/geo.service");
let SafetyZonesService = class SafetyZonesService {
    safetyZoneRepository;
    geoService;
    constructor(safetyZoneRepository, geoService) {
        this.safetyZoneRepository = safetyZoneRepository;
        this.geoService = geoService;
    }
    async findZonesNearPoint(lat, lng, radiusMeters) {
        const point = this.geoService.createPoint(lat, lng);
        return this.safetyZoneRepository
            .createQueryBuilder('zone')
            .where('ST_DWithin(zone.boundary::geography, ST_SetSRID(ST_GeomFromGeoJSON(:point), 4326)::geography, :distance)', {
            point: JSON.stringify(point),
            distance: radiusMeters,
        })
            .getMany();
    }
    isZoneActive(zone) {
        if (zone.type !== 'SCHOOL' || !zone.activeHours) {
            return true;
        }
        const now = new Date();
        const [startStr, endStr] = zone.activeHours.split('-');
        if (!startStr || !endStr)
            return true;
        const currentTotalMins = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = startStr.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const [endH, endM] = endStr.split(':').map(Number);
        const endTotal = endH * 60 + endM;
        const day = now.getDay();
        if (day === 0 || day === 6)
            return false;
        return currentTotalMins >= startTotal && currentTotalMins <= endTotal;
    }
};
exports.SafetyZonesService = SafetyZonesService;
exports.SafetyZonesService = SafetyZonesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(safety_zone_entity_1.SafetyZone)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        geo_service_1.GeoService])
], SafetyZonesService);
//# sourceMappingURL=safety-zones.service.js.map