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
exports.ApiUsageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_usage_entity_1 = require("./entities/api-usage.entity");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
let ApiUsageService = class ApiUsageService {
    repo;
    configService;
    quotaDaily;
    retentionDays;
    constructor(repo, configService) {
        this.repo = repo;
        this.configService = configService;
        this.quotaDaily = this.configService.get('TOMTOM_QUOTA_DAILY') ?? 10000;
        this.retentionDays = this.configService.get('API_USAGE_RETENTION_DAYS') ?? 90;
    }
    async record(dto) {
        const usage = this.repo.create(dto);
        return this.repo.save(usage);
    }
    async increment(apiName, endpoint, userId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const existing = await this.repo.findOne({
            where: {
                apiName,
                endpoint,
                userId: userId ?? null,
                date: (0, typeorm_2.Between)(startOfDay, new Date()),
            },
        });
        if (existing) {
            existing.count += 1;
            return this.repo.save(existing);
        }
        const usage = this.repo.create({ apiName, endpoint, userId, count: 1, date: new Date() });
        return this.repo.save(usage);
    }
    async getReport(start, end) {
        const where = {};
        if (start && end) {
            where.date = (0, typeorm_2.Between)(start, end);
        }
        const rows = await this.repo.find({ where });
        const report = rows.reduce((acc, cur) => {
            const dateKey = cur.date.toISOString().split('T')[0];
            if (!acc[dateKey])
                acc[dateKey] = {};
            if (!acc[dateKey][cur.endpoint])
                acc[dateKey][cur.endpoint] = 0;
            acc[dateKey][cur.endpoint] += cur.count;
            return acc;
        }, {});
        return report;
    }
    async getQuotaStatus() {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const used = await this.repo.count({
            where: {
                apiName: 'TomTom',
                date: (0, typeorm_2.Between)(startOfDay, new Date()),
            },
        });
        return { used, limit: this.quotaDaily };
    }
    async enforceQuota() {
        const { used, limit } = await this.getQuotaStatus();
        if (used >= limit) {
            throw new common_1.ForbiddenException('TomTom daily quota exceeded');
        }
    }
    async cleanupOldRecords() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.retentionDays);
        await this.repo.delete({ date: (0, typeorm_2.Between)(new Date('1970-01-01'), cutoff) });
    }
};
exports.ApiUsageService = ApiUsageService;
__decorate([
    (0, schedule_1.Cron)('0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiUsageService.prototype, "cleanupOldRecords", null);
exports.ApiUsageService = ApiUsageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_usage_entity_1.ApiUsage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], ApiUsageService);
//# sourceMappingURL=api-usage.service.js.map