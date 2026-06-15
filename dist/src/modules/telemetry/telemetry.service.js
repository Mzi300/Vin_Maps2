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
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vehicle_telemetry_entity_1 = require("./entities/vehicle-telemetry.entity");
const geo_service_1 = require("../geo/geo.service");
const telemetry_gateway_1 = require("./telemetry.gateway");
const telemetry_clustering_service_1 = require("./telemetry-clustering.service");
const safety_zones_service_1 = require("../safety-zones/safety-zones.service");
let TelemetryService = class TelemetryService {
    telemetryRepository;
    geoService;
    telemetryGateway;
    clusteringService;
    safetyZonesService;
    constructor(telemetryRepository, geoService, telemetryGateway, clusteringService, safetyZonesService) {
        this.telemetryRepository = telemetryRepository;
        this.geoService = geoService;
        this.telemetryGateway = telemetryGateway;
        this.clusteringService = clusteringService;
        this.safetyZonesService = safetyZonesService;
    }
    async processLocationUpdate(userId, dto) {
        const point = this.geoService.createPoint(dto.latitude, dto.longitude);
        const telemetry = this.telemetryRepository.create({
            userId,
            location: point,
            speed: dto.speed,
            heading: dto.heading,
            accuracy: dto.accuracy,
        });
        await this.telemetryRepository.save(telemetry);
        this.clusteringService.trackVehicle(userId, dto.latitude, dto.longitude, dto.speed);
        const nearbyZones = await this.safetyZonesService.findZonesNearPoint(dto.latitude, dto.longitude, 100);
        for (const zone of nearbyZones) {
            if (this.safetyZonesService.isZoneActive(zone)) {
                let msg = 'Safety zone ahead.';
                let speed = 60;
                if (zone.type === 'SCHOOL') {
                    msg = 'School zone ahead. Reduce speed.';
                    speed = 40;
                }
                else if (zone.type === 'CRIME')
                    msg = 'High crime risk area.';
                else if (zone.type === 'ENVIRONMENT')
                    msg = 'Environmental hazard zone.';
                this.telemetryGateway.server.emit('safety_zone_alert', {
                    zoneType: zone.type,
                    riskLevel: zone.riskLevel,
                    message: zone.description || msg,
                    recommendedSpeed: speed,
                    timestamp: new Date(),
                });
                break;
            }
        }
        this.telemetryGateway.broadcastLocationUpdate({
            userId,
            lat: dto.latitude,
            lng: dto.longitude,
            speed: dto.speed,
            heading: dto.heading,
            timestamp: new Date(),
        });
        return { success: true };
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vehicle_telemetry_entity_1.VehicleTelemetry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        geo_service_1.GeoService,
        telemetry_gateway_1.TelemetryGateway,
        telemetry_clustering_service_1.TelemetryClusteringService,
        safety_zones_service_1.SafetyZonesService])
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map