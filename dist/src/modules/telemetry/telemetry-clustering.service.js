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
var TelemetryClusteringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryClusteringService = void 0;
const common_1 = require("@nestjs/common");
const geo_service_1 = require("../geo/geo.service");
const telemetry_gateway_1 = require("./telemetry.gateway");
const traffic_history_service_1 = require("./traffic-history.service");
const traffic_prediction_service_1 = require("./traffic-prediction.service");
const crypto_1 = require("crypto");
let TelemetryClusteringService = TelemetryClusteringService_1 = class TelemetryClusteringService {
    geoService;
    gateway;
    historyService;
    predictionService;
    logger = new common_1.Logger(TelemetryClusteringService_1.name);
    activeVehicles = new Map();
    clusters = new Map();
    intervalId;
    constructor(geoService, gateway, historyService, predictionService) {
        this.geoService = geoService;
        this.gateway = gateway;
        this.historyService = historyService;
        this.predictionService = predictionService;
    }
    onModuleInit() {
        this.intervalId = setInterval(() => this.analyzeClusters(), 5000);
    }
    onModuleDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    trackVehicle(userId, lat, lng, speed) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            return;
        if (speed < 0 || speed > 300)
            return;
        this.activeVehicles.set(userId, {
            userId,
            lat,
            lng,
            speed,
            timestamp: new Date(),
        });
    }
    getActiveVehiclesCount() {
        return this.activeVehicles.size;
    }
    getActiveClusters() {
        return Array.from(this.clusters.values());
    }
    analyzeClusters() {
        const now = new Date();
        for (const [userId, state] of this.activeVehicles.entries()) {
            if (now.getTime() - state.timestamp.getTime() > 60000) {
                this.activeVehicles.delete(userId);
            }
        }
        const vehicles = Array.from(this.activeVehicles.values());
        if (vehicles.length === 0)
            return;
        const visited = new Set();
        const newClusters = new Map();
        for (const v of vehicles) {
            if (visited.has(v.userId))
                continue;
            const clusterVehicles = [v];
            visited.add(v.userId);
            for (const other of vehicles) {
                if (visited.has(other.userId))
                    continue;
                if (this.geoService.isWithinRadius(v.lat, v.lng, other.lat, other.lng, 100)) {
                    clusterVehicles.push(other);
                    visited.add(other.userId);
                }
            }
            if (clusterVehicles.length > 0) {
                const cluster = this.processCluster(clusterVehicles);
                newClusters.set(cluster.id, cluster);
                const snapshot = {
                    clusterId: cluster.id,
                    timestamp: cluster.createdAt,
                    vehicleCount: cluster.vehicleCount,
                    averageSpeed: cluster.averageSpeed,
                    trafficLevel: cluster.trafficLevel,
                    centerLat: cluster.centerLat,
                    centerLng: cluster.centerLng,
                };
                this.historyService.recordSnapshot(snapshot);
                this.predictionService.predictClusterTraffic(snapshot);
                this.logger.debug(`Broadcasting cluster ${cluster.id} update: ${cluster.trafficLevel}`);
                this.gateway.server.emit('traffic_cluster_update', {
                    clusterId: cluster.id,
                    center: { lat: cluster.centerLat, lng: cluster.centerLng },
                    vehicleCount: cluster.vehicleCount,
                    averageSpeed: cluster.averageSpeed,
                    trafficLevel: cluster.trafficLevel,
                    timestamp: new Date(),
                });
                if (cluster.trafficLevel === 'CONGESTION') {
                    this.gateway.server.emit('CONGESTION_ALERT', {
                        clusterId: cluster.id,
                        center: { lat: cluster.centerLat, lng: cluster.centerLng },
                        message: 'Severe congestion detected ahead.',
                        timestamp: new Date(),
                    });
                }
            }
        }
        this.clusters = newClusters;
    }
    processCluster(vehicles) {
        const vehicleCount = vehicles.length;
        const avgLat = vehicles.reduce((sum, v) => sum + v.lat, 0) / vehicleCount;
        const avgLng = vehicles.reduce((sum, v) => sum + v.lng, 0) / vehicleCount;
        const averageSpeed = vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicleCount;
        let trafficLevel = 'LOW';
        if (averageSpeed < 5 && vehicleCount >= 2) {
            trafficLevel = 'CONGESTION';
        }
        else if (vehicleCount > 15 || averageSpeed < 20) {
            trafficLevel = 'HIGH';
        }
        else if ((vehicleCount >= 5 && vehicleCount <= 15) || (averageSpeed >= 20 && averageSpeed <= 40)) {
            trafficLevel = 'AVERAGE';
        }
        else if (vehicleCount < 5 && averageSpeed > 40) {
            trafficLevel = 'LOW';
        }
        let clusterId = (0, crypto_1.randomUUID)();
        for (const [existingId, existingCluster] of this.clusters.entries()) {
            if (this.geoService.isWithinRadius(avgLat, avgLng, existingCluster.centerLat, existingCluster.centerLng, 150)) {
                clusterId = existingId;
                break;
            }
        }
        return {
            id: clusterId,
            centerLat: avgLat,
            centerLng: avgLng,
            vehicleCount,
            averageSpeed,
            trafficLevel,
            vehicles: vehicles.map(v => v.userId),
            createdAt: new Date(),
        };
    }
};
exports.TelemetryClusteringService = TelemetryClusteringService;
exports.TelemetryClusteringService = TelemetryClusteringService = TelemetryClusteringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [geo_service_1.GeoService,
        telemetry_gateway_1.TelemetryGateway,
        traffic_history_service_1.TrafficHistoryService,
        traffic_prediction_service_1.TrafficPredictionService])
], TelemetryClusteringService);
//# sourceMappingURL=telemetry-clustering.service.js.map