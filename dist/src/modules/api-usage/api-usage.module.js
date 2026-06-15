"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiUsageModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const api_usage_service_1 = require("./api-usage.service");
const api_usage_controller_1 = require("./api-usage.controller");
const api_usage_entity_1 = require("./entities/api-usage.entity");
let ApiUsageModule = class ApiUsageModule {
};
exports.ApiUsageModule = ApiUsageModule;
exports.ApiUsageModule = ApiUsageModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([api_usage_entity_1.ApiUsage])],
        providers: [api_usage_service_1.ApiUsageService],
        controllers: [api_usage_controller_1.ApiUsageController],
        exports: [api_usage_service_1.ApiUsageService],
    })
], ApiUsageModule);
//# sourceMappingURL=api-usage.module.js.map