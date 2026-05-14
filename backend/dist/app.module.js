"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const hazards_module_1 = require("./hazards/hazards.module");
const intelligence_module_1 = require("./intelligence/intelligence.module");
const emergency_module_1 = require("./emergency/emergency.module");
const fleet_module_1 = require("./fleet/fleet.module");
const smart_city_module_1 = require("./smart-city/smart-city.module");
const auth_module_1 = require("./auth/auth.module");
const hazard_entity_1 = require("./hazards/hazard.entity");
const driver_session_entity_1 = require("./fleet/driver-session.entity");
const traffic_light_entity_1 = require("./smart-city/traffic-light.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vinmaps',
                entities: [hazard_entity_1.Hazard, driver_session_entity_1.DriverSession, traffic_light_entity_1.TrafficLight],
                synchronize: true,
                logging: true,
            }),
            hazards_module_1.HazardsModule,
            intelligence_module_1.IntelligenceModule,
            emergency_module_1.EmergencyModule,
            fleet_module_1.FleetModule,
            smart_city_module_1.SmartCityModule,
            auth_module_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map