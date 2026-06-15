import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { GeoService } from '../geo/geo.service';
import { TelemetryGateway } from './telemetry.gateway';
import { TrafficHistoryService } from './traffic-history.service';
import { TrafficPredictionService } from './traffic-prediction.service';
interface TrafficCluster {
    id: string;
    centerLat: number;
    centerLng: number;
    vehicleCount: number;
    averageSpeed: number;
    trafficLevel: string;
    vehicles: string[];
    createdAt: Date;
}
export declare class TelemetryClusteringService implements OnModuleInit, OnModuleDestroy {
    private readonly geoService;
    private readonly gateway;
    private readonly historyService;
    private readonly predictionService;
    private readonly logger;
    private activeVehicles;
    private clusters;
    private intervalId;
    constructor(geoService: GeoService, gateway: TelemetryGateway, historyService: TrafficHistoryService, predictionService: TrafficPredictionService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    trackVehicle(userId: string, lat: number, lng: number, speed: number): void;
    getActiveVehiclesCount(): number;
    getActiveClusters(): TrafficCluster[];
    private analyzeClusters;
    private processCluster;
}
export {};
