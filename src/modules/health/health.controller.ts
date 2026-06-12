import { Controller, Get } from '@nestjs/common';
import { TelemetryClusteringService } from '../telemetry/telemetry-clustering.service';
import { TrafficHistoryService } from '../telemetry/traffic-history.service';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';

@Controller('system')
export class HealthController {
  constructor(
    private readonly clusteringService: TelemetryClusteringService,
    private readonly historyService: TrafficHistoryService,
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  @Get('health')
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
}
