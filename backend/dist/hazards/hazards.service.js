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
exports.HazardsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hazard_entity_1 = require("./hazard.entity");
let HazardsService = class HazardsService {
    hazardsRepository;
    constructor(hazardsRepository) {
        this.hazardsRepository = hazardsRepository;
    }
    async report(data) {
        const { type, location } = data;
        if (!location || !location.coordinates)
            return this.create(data);
        const [lng, lat] = location.coordinates;
        const existing = await this.hazardsRepository
            .createQueryBuilder('hazard')
            .where('hazard.type = :type', { type })
            .andWhere('ST_DWithin(hazard.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)', { lng, lat, radius: 20 / 111320 })
            .getOne();
        if (existing) {
            existing.upvotes += 1;
            existing.confidence_score = Math.min(100, existing.confidence_score + 5);
            console.log(`[Conflict Resolution] Merging report into existing hazard: ${existing.id}`);
            return this.hazardsRepository.save(existing);
        }
        return this.create(data);
    }
    async create(data) {
        const hazard = this.hazardsRepository.create(data);
        return this.hazardsRepository.save(hazard);
    }
    async findAll() {
        return this.hazardsRepository.find();
    }
    async findNearby(lng, lat, radiusMeters = 5000) {
        return this.hazardsRepository
            .createQueryBuilder('hazard')
            .where('ST_DWithin(hazard.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)', { lng, lat, radius: radiusMeters / 111320 })
            .getMany();
    }
};
exports.HazardsService = HazardsService;
exports.HazardsService = HazardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hazard_entity_1.Hazard)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HazardsService);
//# sourceMappingURL=hazards.service.js.map