import axios from 'axios';
import { io } from 'socket.io-client';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3000/telemetry/location-update';
const WS_URL = 'http://localhost:3000/live';
const VEHICLE_COUNT = 200;

console.log(`Starting VinMaps Stress Test: ${VEHICLE_COUNT} simulated vehicles`);

const vehicles = Array.from({ length: VEHICLE_COUNT }).map(() => ({
  id: randomUUID(),
  lat: -26.2041 + (Math.random() * 0.1 - 0.05),
  lng: 28.0473 + (Math.random() * 0.1 - 0.05),
}));

// Setup WebSocket Listener
const socket = io(WS_URL, { transports: ['websocket'] });
socket.on('connect', () => {
  console.log('Test Client connected to /live namespace');
});
socket.on('traffic_cluster_update', (data) => console.log('Cluster Update:', data.trafficLevel, data.vehicleCount, 'vehicles'));
socket.on('CONGESTION_ALERT', (data) => console.log('🔥 CONGESTION ALERT:', data.message));

// Simulate Traffic
setInterval(async () => {
  for (const v of vehicles) {
    // Move slightly
    v.lat += (Math.random() * 0.001 - 0.0005);
    v.lng += (Math.random() * 0.001 - 0.0005);
    const speed = Math.floor(Math.random() * 80);

    try {
      await axios.post(API_URL, {
        latitude: v.lat,
        longitude: v.lng,
        speed,
        heading: 90,
        accuracy: 5,
      });
    } catch (e) {
      // Ignore errors in stress test loop
    }
  }
}, 2000);
