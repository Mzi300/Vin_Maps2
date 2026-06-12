import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Local DTO definition matching backend payload
export interface TrafficClusterDto {
  clusterId: string;
  center: { lat: number; lng: number };
  vehicleCount: number;
  averageSpeed: number;
  trafficLevel: 'LOW' | 'AVERAGE' | 'HIGH' | 'CONGESTION';
  timestamp: Date;
}

// Determine backend URL; fallback to same origin with different port if needed.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.protocol + '//' + window.location.hostname + ':3000');

export const useTraffic = () => {
  const [clusters, setClusters] = useState<TrafficClusterDto[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(BACKEND_URL, {
      transports: ['websocket'],
    });
    setSocket(s);
    s.on('connect', () => {
      console.log('⚡️ Connected to traffic socket');
    });
    s.on('traffic_cluster_update', (data: any) => {
      // data shape matches TrafficClusterDto (except timestamp as string)
      const updated = {
        clusterId: data.clusterId,
        center: { lat: data.center.lat, lng: data.center.lng },
        vehicleCount: data.vehicleCount,
        averageSpeed: data.averageSpeed,
        trafficLevel: data.trafficLevel,
        timestamp: new Date(data.timestamp),
      } as TrafficClusterDto;
      setClusters((prev) => {
        const existingIdx = prev.findIndex((c) => c.clusterId === updated.clusterId);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
    });
    s.on('disconnect', () => {
      console.log('🔌 Disconnected from traffic socket');
    });
    return () => {
      s.disconnect();
    };
  }, []);

  return { clusters, socket };
};
