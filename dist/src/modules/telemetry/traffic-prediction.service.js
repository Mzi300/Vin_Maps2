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
exports.TrafficPredictionService = void 0;
const common_1 = require("@nestjs/common");
const traffic_history_service_1 = require("./traffic-history.service");
const telemetry_gateway_1 = require("./telemetry.gateway");
let TrafficPredictionService = class TrafficPredictionService {
    historyService;
    gateway;
    constructor(historyService, gateway) {
        this.historyService = historyService;
        this.gateway = gateway;
    }
    predictClusterTraffic(currentCluster) {
        const history = this.historyService.getHistory(currentCluster.clusterId);
        if (history.length < 2)
            return;
        const pastSnapshot = history[0];
        const dVehicles = currentCluster.vehicleCount - pastSnapshot.vehicleCount;
        const dSpeed = currentCluster.averageSpeed - pastSnapshot.averageSpeed;
        let trendFactor = 0;
        if (dVehicles > 0 && dSpeed < 0) {
            trendFactor = 1;
        }
        else if (dVehicles < 0 && dSpeed > 0) {
            trendFactor = -1;
        }
        let predictedLevel = currentCluster.trafficLevel;
        let confidence = 0.5;
        if (trendFactor > 0 && currentCluster.trafficLevel === 'HIGH') {
            predictedLevel = 'PREDICTED_CONGESTION';
            confidence = 0.85;
        }
        else if (trendFactor > 0 && currentCluster.trafficLevel === 'AVERAGE') {
            predictedLevel = 'HIGH';
            confidence = 0.75;
        }
        else if (trendFactor < 0 && currentCluster.trafficLevel === 'HIGH') {
            predictedLevel = 'AVERAGE';
            confidence = 0.65;
        }
        else if (trendFactor < 0 && currentCluster.trafficLevel === 'CONGESTION') {
            predictedLevel = 'HIGH';
            confidence = 0.60;
        }
        if (predictedLevel !== currentCluster.trafficLevel) {
            this.gateway.server.emit('traffic_prediction_update', {
                clusterId: currentCluster.clusterId,
                currentLevel: currentCluster.trafficLevel,
                predictedLevel,
                confidence,
                timeHorizon: '15min',
                center: { lat: currentCluster.centerLat, lng: currentCluster.centerLng },
                timestamp: new Date(),
            });
        }
    }
};
exports.TrafficPredictionService = TrafficPredictionService;
exports.TrafficPredictionService = TrafficPredictionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [traffic_history_service_1.TrafficHistoryService,
        telemetry_gateway_1.TelemetryGateway])
], TrafficPredictionService);
//# sourceMappingURL=traffic-prediction.service.js.map