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
exports.ApiUsageController = void 0;
const common_1 = require("@nestjs/common");
const api_usage_service_1 = require("./api-usage.service");
const admin_auth_guard_1 = require("../../auth/admin-auth.guard");
let ApiUsageController = class ApiUsageController {
    apiUsageService;
    constructor(apiUsageService) {
        this.apiUsageService = apiUsageService;
    }
    async getReport(start, end) {
        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;
        return this.apiUsageService.getReport(startDate, endDate);
    }
    async getQuota() {
        return this.apiUsageService.getQuotaStatus();
    }
};
exports.ApiUsageController = ApiUsageController;
__decorate([
    (0, common_1.Get)('report'),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApiUsageController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)('quota'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiUsageController.prototype, "getQuota", null);
exports.ApiUsageController = ApiUsageController = __decorate([
    (0, common_1.Controller)('api-usage'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [api_usage_service_1.ApiUsageService])
], ApiUsageController);
//# sourceMappingURL=api-usage.controller.js.map