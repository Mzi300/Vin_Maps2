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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const telemetry_clustering_service_1 = require("../telemetry/telemetry-clustering.service");
const traffic_history_service_1 = require("../telemetry/traffic-history.service");
const telemetry_gateway_1 = require("../telemetry/telemetry.gateway");
let HealthController = class HealthController {
    clusteringService;
    historyService;
    telemetryGateway;
    constructor(clusteringService, historyService, telemetryGateway) {
        this.clusteringService = clusteringService;
        this.historyService = historyService;
        this.telemetryGateway = telemetryGateway;
    }
    getSystemHealth() {
        return {
            status: 'OK',
            metrics: {
                activeVehicles: this.clusteringService.getActiveVehiclesCount(),
                activeClusters: this.clusteringService.getActiveClusters().length,
                historyWindows: this.historyService.getHistorySize(),
                websocketConnections: this.telemetryGateway.server?.sockets?.sockets?.size || 0,
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getSystemHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('system'),
    __metadata("design:paramtypes", [telemetry_clustering_service_1.TelemetryClusteringService,
        traffic_history_service_1.TrafficHistoryService,
        telemetry_gateway_1.TelemetryGateway])
], HealthController);
//# sourceMappingURL=health.controller.js.map