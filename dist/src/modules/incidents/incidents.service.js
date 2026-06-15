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
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const incident_entity_1 = require("./entities/incident.entity");
const geo_service_1 = require("../geo/geo.service");
const telemetry_gateway_1 = require("../telemetry/telemetry.gateway");
let IncidentsService = class IncidentsService {
    incidentRepository;
    geoService;
    telemetryGateway;
    constructor(incidentRepository, geoService, telemetryGateway) {
        this.incidentRepository = incidentRepository;
        this.geoService = geoService;
        this.telemetryGateway = telemetryGateway;
    }
    async createIncident(reporterId, dto) {
        const point = this.geoService.createPoint(dto.latitude, dto.longitude);
        const incident = this.incidentRepository.create({
            reporterId,
            type: dto.type,
            severity: dto.severity,
            location: point,
            description: dto.description,
            mediaUrl: dto.mediaUrl,
        });
        const savedIncident = await this.incidentRepository.save(incident);
        this.telemetryGateway.server.emit('incident_created', {
            type: savedIncident.type,
            severity: savedIncident.severity,
            lat: dto.latitude,
            lng: dto.longitude,
            timestamp: savedIncident.createdAt,
        });
        return savedIncident;
    }
    async findNearby(lat, lng, radiusKm) {
        const origin = this.geoService.createPoint(lat, lng);
        const radiusMeters = radiusKm * 1000;
        return this.incidentRepository
            .createQueryBuilder('incident')
            .where('ST_DWithin(incident.location, ST_GeomFromEWKT(:origin), :distance)', {
            origin,
            distance: radiusMeters,
        })
            .andWhere('incident.status IN (:...statuses)', { statuses: ['PENDING', 'VERIFIED'] })
            .getMany();
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(incident_entity_1.Incident)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        geo_service_1.GeoService,
        telemetry_gateway_1.TelemetryGateway])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map