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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const analytics_entity_1 = require("./entities/analytics.entity");
const config_1 = require("@nestjs/config");
const date_fns_1 = require("date-fns");
let AnalyticsService = class AnalyticsService {
    analyticsRepository;
    configService;
    constructor(analyticsRepository, configService) {
        this.analyticsRepository = analyticsRepository;
        this.configService = configService;
    }
    async record(entry) {
        const analytics = this.analyticsRepository.create(entry);
        return this.analyticsRepository.save(analytics);
    }
    async getUsageStats(start, end) {
        const qb = this.analyticsRepository
            .createQueryBuilder('a')
            .select("DATE_TRUNC('day', a.timestamp)", 'date')
            .addSelect('COUNT(*)', 'count')
            .groupBy('date')
            .orderBy('date', 'ASC');
        if (start)
            qb.andWhere('a.timestamp >= :start', { start });
        if (end)
            qb.andWhere('a.timestamp <= :end', { end });
        return qb.getRawMany();
    }
    async getPopularRoutes(start, end, limit = 10) {
        const qb = this.analyticsRepository
            .createQueryBuilder('a')
            .select('a.origin', 'origin')
            .addSelect('a.destination', 'destination')
            .addSelect('COUNT(*)', 'count')
            .where('a.origin IS NOT NULL')
            .andWhere('a.destination IS NOT NULL')
            .groupBy('a.origin')
            .addGroupBy('a.destination')
            .orderBy('count', 'DESC')
            .limit(limit);
        if (start)
            qb.andWhere('a.timestamp >= :start', { start });
        if (end)
            qb.andWhere('a.timestamp <= :end', { end });
        return qb.getRawMany();
    }
    async purgeOld() {
        const retention = this.configService.get('ANALYTICS_RETENTION_DAYS') || 30;
        const cutoff = (0, date_fns_1.subDays)(new Date(), retention);
        await this.analyticsRepository.delete({ timestamp: { $lt: cutoff } });
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(analytics_entity_1.Analytics)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map