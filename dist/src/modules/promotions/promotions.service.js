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
exports.PromotionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const promotion_entity_1 = require("./entities/promotion.entity");
const config_1 = require("@nestjs/config");
let PromotionsService = class PromotionsService {
    promotionRepository;
    configService;
    constructor(promotionRepository, configService) {
        this.promotionRepository = promotionRepository;
        this.configService = configService;
    }
    async create(dto) {
        if (new Date(dto.startDate) >= new Date(dto.endDate)) {
            throw new common_1.BadRequestException('startDate must be before endDate');
        }
        const promotion = this.promotionRepository.create(dto);
        return this.promotionRepository.save(promotion);
    }
    async findOne(id) {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion) {
            throw new common_1.NotFoundException('Promotion not found');
        }
        return promotion;
    }
    async findAll() {
        return this.promotionRepository.find();
    }
    async findActive() {
        const now = new Date();
        return this.promotionRepository.find({
            where: {
                startDate: { $lte: now },
                endDate: { $gte: now },
            },
        });
    }
    async update(id, dto) {
        const promotion = await this.findOne(id);
        if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
            throw new common_1.BadRequestException('startDate must be before endDate');
        }
        Object.assign(promotion, dto);
        return this.promotionRepository.save(promotion);
    }
    async remove(id) {
        const promotion = await this.findOne(id);
        await this.promotionRepository.remove(promotion);
    }
    async purgeOld() {
        const retention = this.configService.get('PROMOTION_RETENTION_DAYS') || 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retention);
        await this.promotionRepository.delete({ endDate: { $lt: cutoff } });
    }
};
exports.PromotionsService = PromotionsService;
exports.PromotionsService = PromotionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(promotion_entity_1.Promotion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], PromotionsService);
//# sourceMappingURL=promotions.service.js.map