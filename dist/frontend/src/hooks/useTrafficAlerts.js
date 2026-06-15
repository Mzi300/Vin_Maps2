import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
export const useTrafficAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        const s = io(import.meta.env.VITE_BACKEND_URL || (window.location.protocol + '//' + window.location.hostname + ':3000'), {
            transports: ['websocket'],
        });
        setSocket(s);
        s.on('connect', () => {
            console.log('⚡️ Connected to traffic alerts socket');
        });
        s.on('CONGESTION_ALERT', (data) => {
            const newAlert = {
                id: crypto.randomUUID(),
                clusterId: data.clusterId,
                message: data.message || 'Severe congestion detected ahead.',
                timestamp: new Date(data.timestamp),
            };
            setAlerts((prev) => [...prev, newAlert]);
        });
        s.on('disconnect', () => console.log('🔌 Disconnected from alerts socket'));
        return () => {
            s.disconnect();
        };
    }, []);
    useEffect(() => {
        const timer = setInterval(() => {
            setAlerts((prev) => prev.filter((a) => Date.now() - a.timestamp.getTime() < 12000));
        }, 4000);
        return () => clearInterval(timer);
    }, []);
    return { alerts, socket };
};
//# sourceMappingURL=useTrafficAlerts.js.map