"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HazardsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const hazard_entity_1 = require("./hazard.entity");
const hazards_service_1 = require("./hazards.service");
const hazards_gateway_1 = require("./hazards.gateway");
let HazardsModule = class HazardsModule {
};
exports.HazardsModule = HazardsModule;
exports.HazardsModule = HazardsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([hazard_entity_1.Hazard])],
        providers: [hazards_service_1.HazardsService, hazards_gateway_1.HazardsGateway],
        exports: [hazards_service_1.HazardsService],
    })
], HazardsModule);
//# sourceMappingURL=hazards.module.js.map