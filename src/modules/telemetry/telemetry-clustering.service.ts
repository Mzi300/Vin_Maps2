import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { GeoService } from '../geo/geo.service';
import { TelemetryGateway } from './telemetry.gateway';
import { TrafficHistoryService } from './traffic-history.service';
import { TrafficPredictionService } from './traffic-prediction.service';
import { randomUUID } from 'crypto';

interface VehicleState {
  userId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: Date;
}

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

@Injectable()
export class TelemetryClusteringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryClusteringService.name);
  private activeVehicles = new Map<string, VehicleState>();
  private clusters = new Map<string, TrafficCluster>();
  private intervalId: NodeJS.Timeout;

  constructor(
    private readonly geoService: GeoService,
    private readonly gateway: TelemetryGateway,
    private readonly historyService: TrafficHistoryService,
    private readonly predictionService: TrafficPredictionService,
  ) {}

  onModuleInit() {
    this.intervalId = setInterval(() => this.analyzeClusters(), 5000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  trackVehicle(userId: string, lat: number, lng: number, speed: number) {
    // Edge case: Ignore invalid/noisy GPS coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    if (speed < 0 || speed > 300) return; // Unrealistic speeds

    this.activeVehicles.set(userId, {
      userId,
      lat,
      lng,
      speed,
      timestamp: new Date(),
    });
  }

  getActiveVehiclesCount(): number {
    return this.activeVehicles.size;
  }

  getActiveClusters(): TrafficCluster[] {
    return Array.from(this.clusters.values());
  }

  private analyzeClusters() {
    const now = new Date();
    
    for (const [userId, state] of this.activeVehicles.entries()) {
      if (now.getTime() - state.timestamp.getTime() > 60000) {
        this.activeVehicles.delete(userId);
      }
    }

    const vehicles = Array.from(this.activeVehicles.values());
    if (vehicles.length === 0) return;

    const visited = new Set<string>();
    const newClusters = new Map<string, TrafficCluster>();

    for (const v of vehicles) {
      if (visited.has(v.userId)) continue;

      const clusterVehicles = [v];
      visited.add(v.userId);

      for (const other of vehicles) {
        if (visited.has(other.userId)) continue;

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

  private processCluster(vehicles: VehicleState[]): TrafficCluster {
    const vehicleCount = vehicles.length;
    const avgLat = vehicles.reduce((sum, v) => sum + v.lat, 0) / vehicleCount;
    const avgLng = vehicles.reduce((sum, v) => sum + v.lng, 0) / vehicleCount;
    const averageSpeed = vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicleCount;

    let trafficLevel = 'LOW';

    if (averageSpeed < 5 && vehicleCount >= 2) {
      trafficLevel = 'CONGESTION';
    } else if (vehicleCount > 15 || averageSpeed < 20) {
      trafficLevel = 'HIGH';
    } else if ((vehicleCount >= 5 && vehicleCount <= 15) || (averageSpeed >= 20 && averageSpeed <= 40)) {
      trafficLevel = 'AVERAGE';
    } else if (vehicleCount < 5 && averageSpeed > 40) {
      trafficLevel = 'LOW';
    }

    // Try to match with existing cluster ID to keep history consistent
    let clusterId = randomUUID();
    for (const [existingId, existingCluster] of this.clusters.entries()) {
      if (this.geoService.isWithinRadius(avgLat, avgLng, existingCluster.centerLat, existingCluster.centerLng, 150)) {
        clusterId = existingId as any;
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
}
