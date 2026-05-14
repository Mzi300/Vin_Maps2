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
exports.IntelligenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hazard_entity_1 = require("../hazards/hazard.entity");
let IntelligenceService = class IntelligenceService {
    hazardsRepository;
    constructor(hazardsRepository) {
        this.hazardsRepository = hazardsRepository;
    }
    async scoreRoute(coordinates) {
        if (coordinates.length < 2)
            return { score: 100, hazardsFound: 0 };
        const lineStringWkt = `LINESTRING(${coordinates.map(c => `${c[0]} ${c[1]}`).join(',')})`;
        const hazards = await this.hazardsRepository
            .createQueryBuilder('hazard')
            .where(`ST_DWithin(
          hazard.location, 
          ST_GeomFromText(:wkt, 4326), 
          :buffer
        )`, { wkt: lineStringWkt, buffer: 0.0005 })
            .getMany();
        let penalty = 0;
        hazards.forEach(h => {
            switch (h.severity) {
                case hazard_entity_1.HazardSeverity.CRITICAL:
                    penalty += 20;
                    break;
                case hazard_entity_1.HazardSeverity.WARNING:
                    penalty += 10;
                    break;
                case hazard_entity_1.HazardSeverity.INFO:
                    penalty += 5;
                    break;
            }
        });
        const score = Math.max(0, 100 - penalty);
        return {
            score,
            hazardsFound: hazards.length,
            criticalHazards: hazards.filter(h => h.severity === hazard_entity_1.HazardSeverity.CRITICAL).length,
            potholes: hazards.filter(h => h.type === 'pothole').length,
            details: hazards.map(h => ({
                id: h.id,
                type: h.type,
                severity: h.severity,
                location: h.location.coordinates
            }))
        };
    }
};
exports.IntelligenceService = IntelligenceService;
exports.IntelligenceService = IntelligenceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hazard_entity_1.Hazard)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], IntelligenceService);
//# sourceMappingURL=intelligence.service.js.map