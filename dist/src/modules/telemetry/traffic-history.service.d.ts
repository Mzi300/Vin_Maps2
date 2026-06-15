export interface ClusterSnapshot {
    clusterId: string;
    timestamp: Date;
    vehicleCount: number;
    averageSpeed: number;
    trafficLevel: string;
    centerLat: number;
    centerLng: number;
}
export declare class TrafficHistoryService {
    private readonly logger;
    private history;
    recordSnapshot(snapshot: ClusterSnapshot): void;
    getHistory(clusterId: string): ClusterSnapshot[];
    getHistorySize(): number;
}
