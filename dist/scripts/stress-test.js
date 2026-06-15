"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const socket_io_client_1 = require("socket.io-client");
const crypto_1 = require("crypto");
const API_URL = 'http://localhost:3000/telemetry/location-update';
const WS_URL = 'http://localhost:3000/live';
const VEHICLE_COUNT = 200;
console.log(`Starting VinMaps Stress Test: ${VEHICLE_COUNT} simulated vehicles`);
const vehicles = Array.from({ length: VEHICLE_COUNT }).map(() => ({
    id: (0, crypto_1.randomUUID)(),
    lat: -26.2041 + (Math.random() * 0.1 - 0.05),
    lng: 28.0473 + (Math.random() * 0.1 - 0.05),
}));
const socket = (0, socket_io_client_1.io)(WS_URL, { transports: ['websocket'] });
socket.on('connect', () => {
    console.log('Test Client connected to /live namespace');
});
socket.on('traffic_cluster_update', (data) => console.log('Cluster Update:', data.trafficLevel, data.vehicleCount, 'vehicles'));
socket.on('CONGESTION_ALERT', (data) => console.log('🔥 CONGESTION ALERT:', data.message));
setInterval(async () => {
    for (const v of vehicles) {
        v.lat += (Math.random() * 0.001 - 0.0005);
        v.lng += (Math.random() * 0.001 - 0.0005);
        const speed = Math.floor(Math.random() * 80);
        try {
            await axios_1.default.post(API_URL, {
                latitude: v.lat,
                longitude: v.lng,
                speed,
                heading: 90,
                accuracy: 5,
            });
        }
        catch (e) {
        }
    }
}, 2000);
//# sourceMappingURL=stress-test.js.map