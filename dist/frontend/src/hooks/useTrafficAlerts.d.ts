import { Socket } from 'socket.io-client';
export interface TrafficAlert {
    id: string;
    clusterId: string;
    message: string;
    timestamp: Date;
}
export declare const useTrafficAlerts: () => {
    alerts: TrafficAlert[];
    socket: Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap> | null;
};
