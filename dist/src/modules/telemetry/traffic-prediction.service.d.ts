import { TrafficHistoryService, ClusterSnapshot } from './traffic-history.service';
import { TelemetryGateway } from './telemetry.gateway';
export declare class TrafficPredictionService {
    private readonly historyService;
    private readonly gateway;
    constructor(historyService: TrafficHistoryService, gateway: TelemetryGateway);
    predictClusterTraffic(currentCluster: ClusterSnapshot): void;
}
