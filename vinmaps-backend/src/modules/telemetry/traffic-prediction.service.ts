import { Injectable } from '@nestjs/common';
import { TrafficHistoryService, ClusterSnapshot } from './traffic-history.service';
import { TelemetryGateway } from './telemetry.gateway';

@Injectable()
export class TrafficPredictionService {
  constructor(
    private readonly historyService: TrafficHistoryService,
    private readonly gateway: TelemetryGateway,
  ) {}

  public predictClusterTraffic(currentCluster: ClusterSnapshot) {
    const history = this.historyService.getHistory(currentCluster.clusterId);
    if (history.length < 2) return; // Need at least 2 points to determine trend

    const pastSnapshot = history[0]; // Oldest snapshot in window
    const dVehicles = currentCluster.vehicleCount - pastSnapshot.vehicleCount;
    const dSpeed = currentCluster.averageSpeed - pastSnapshot.averageSpeed;

    let trendFactor = 0;
    
    // Worsening traffic
    if (dVehicles > 0 && dSpeed < 0) {
      trendFactor = 1; 
    } 
    // Improving traffic
    else if (dVehicles < 0 && dSpeed > 0) {
      trendFactor = -1;
    }

    let predictedLevel = currentCluster.trafficLevel;
    let confidence = 0.5;

    if (trendFactor > 0 && currentCluster.trafficLevel === 'HIGH') {
      predictedLevel = 'PREDICTED_CONGESTION';
      confidence = 0.85;
    } else if (trendFactor > 0 && currentCluster.trafficLevel === 'AVERAGE') {
      predictedLevel = 'HIGH';
      confidence = 0.75;
    } else if (trendFactor < 0 && currentCluster.trafficLevel === 'HIGH') {
      predictedLevel = 'AVERAGE';
      confidence = 0.65;
    } else if (trendFactor < 0 && currentCluster.trafficLevel === 'CONGESTION') {
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
}
