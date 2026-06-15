import { Socket } from 'socket.io-client';
export interface TrafficClusterDto {
    clusterId: string;
    center: {
        lat: number;
        lng: number;
    };
    vehicleCount: number;
    averageSpeed: number;
    trafficLevel: 'LOW' | 'AVERAGE' | 'HIGH' | 'CONGESTION';
    timestamp: Date;
}
export declare const useTraffic: () => {
    clusters: TrafficClusterDto[];
    socket: Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap> | null;
};
