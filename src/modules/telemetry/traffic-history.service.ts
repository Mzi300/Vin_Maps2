import { Injectable, Logger } from '@nestjs/common';

export interface ClusterSnapshot {
  clusterId: string;
  timestamp: Date;
  vehicleCount: number;
  averageSpeed: number;
  trafficLevel: string;
  centerLat: number;
  centerLng: number;
}

@Injectable()
export class TrafficHistoryService {
  private readonly logger = new Logger(TrafficHistoryService.name);
  private history = new Map<string, ClusterSnapshot[]>();

  recordSnapshot(snapshot: ClusterSnapshot) {
    if (!this.history.has(snapshot.clusterId)) {
      this.history.set(snapshot.clusterId, []);
    }
    
    const snapshots = this.history.get(snapshot.clusterId)!;
    snapshots.push(snapshot);

    // Keep rolling window (last 30 minutes)
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    while (snapshots.length > 0 && snapshots[0].timestamp.getTime() < thirtyMinsAgo) {
      snapshots.shift();
    }

    // Memory Leak Fix: Remove empty clusters
    if (snapshots.length === 0) {
      this.history.delete(snapshot.clusterId);
      this.logger.debug(`Cleaned up stale history for cluster ${snapshot.clusterId}`);
    }
  }

  getHistory(clusterId: string): ClusterSnapshot[] {
    return this.history.get(clusterId) || [];
  }

  getHistorySize(): number {
    return this.history.size;
  }
}
