import { TelemetryClusteringService } from '../telemetry/telemetry-clustering.service';
import { TrafficHistoryService } from '../telemetry/traffic-history.service';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';
export declare class HealthController {
    private readonly clusteringService;
    private readonly historyService;
    private readonly telemetryGateway;
    constructor(clusteringService: TelemetryClusteringService, historyService: TrafficHistoryService, telemetryGateway: TelemetryGateway);
    getSystemHealth(): {
        status: string;
        metrics: {
            activeVehicles: number;
            activeClusters: number;
            historyWindows: number;
            websocketConnections: number;
        };
        timestamp: string;
    };
}
