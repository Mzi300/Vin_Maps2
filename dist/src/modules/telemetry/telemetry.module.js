"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const vehicle_telemetry_entity_1 = require("./entities/vehicle-telemetry.entity");
const telemetry_service_1 = require("./telemetry.service");
const telemetry_controller_1 = require("./telemetry.controller");
const telemetry_gateway_1 = require("./telemetry.gateway");
const telemetry_clustering_service_1 = require("./telemetry-clustering.service");
const traffic_history_service_1 = require("./traffic-history.service");
const traffic_prediction_service_1 = require("./traffic-prediction.service");
const safety_zones_module_1 = require("../safety-zones/safety-zones.module");
let TelemetryModule = class TelemetryModule {
};
exports.TelemetryModule = TelemetryModule;
exports.TelemetryModule = TelemetryModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([vehicle_telemetry_entity_1.VehicleTelemetry]), safety_zones_module_1.SafetyZonesModule],
        controllers: [telemetry_controller_1.TelemetryController],
        providers: [telemetry_service_1.TelemetryService, telemetry_gateway_1.TelemetryGateway, telemetry_clustering_service_1.TelemetryClusteringService, traffic_history_service_1.TrafficHistoryService, traffic_prediction_service_1.TrafficPredictionService],
        exports: [telemetry_service_1.TelemetryService, telemetry_gateway_1.TelemetryGateway, telemetry_clustering_service_1.TelemetryClusteringService, traffic_history_service_1.TrafficHistoryService, traffic_prediction_service_1.TrafficPredictionService],
    })
], TelemetryModule);
//# sourceMappingURL=telemetry.module.js.map