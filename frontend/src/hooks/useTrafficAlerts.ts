import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TrafficAlert {
  id: string;
  clusterId: string;
  message: string;
  timestamp: Date;
}

export const useTrafficAlerts = () => {
  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL || (window.location.protocol + '//' + window.location.hostname + ':3000'), {
      transports: ['websocket'],
    });
    setSocket(s);
    s.on('connect', () => {
      console.log('⚡️ Connected to traffic alerts socket');
    });
    s.on('CONGESTION_ALERT', (data: any) => {
      const newAlert: TrafficAlert = {
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

  // Auto‑remove alerts after 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAlerts((prev) => prev.filter((a) => Date.now() - a.timestamp.getTime() < 12000));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return { alerts, socket };
};
