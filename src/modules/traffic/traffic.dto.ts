export interface TrafficClusterDto {
  clusterId: string;
  center: { lat: number; lng: number };
  vehicleCount: number;
  averageSpeed: number;
  trafficLevel: 'LOW' | 'AVERAGE' | 'HIGH' | 'CONGESTION';
  timestamp: Date;
}
