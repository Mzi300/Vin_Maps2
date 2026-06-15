import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.protocol + '//' + window.location.hostname + ':3000');
export const useTraffic = () => {
    const [clusters, setClusters] = useState([]);
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        const s = io(BACKEND_URL, {
            transports: ['websocket'],
        });
        setSocket(s);
        s.on('connect', () => {
            console.log('⚡️ Connected to traffic socket');
        });
        s.on('traffic_cluster_update', (data) => {
            const updated = {
                clusterId: data.clusterId,
                center: { lat: data.center.lat, lng: data.center.lng },
                vehicleCount: data.vehicleCount,
                averageSpeed: data.averageSpeed,
                trafficLevel: data.trafficLevel,
                timestamp: new Date(data.timestamp),
            };
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
//# sourceMappingURL=useTraffic.js.map