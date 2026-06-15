"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/routing/smart?start=37.7749,-122.4194&end=37.8044,-122.2712';
async function runVerification() {
    console.log('--- Testing Phase 2D+ Hardening ---');
    try {
        console.log('Sending first request...');
        const res1 = await axios_1.default.get(API_URL);
        console.log(`Response 1 systemMode: ${res1.data.routes[0].systemMode}`);
        console.log('Sending second request immediately (should hit cache)...');
        const res2 = await axios_1.default.get(API_URL);
        console.log(`Response 2 systemMode: ${res2.data.routes[0].systemMode}`);
        if (res1.data.routes[0].systemMode === 'DEGRADED') {
            console.log('✅ DEGRADED Fallback Mode Active!');
            console.log('   - Explanation:', res1.data.routes[0].explanation);
        }
    }
    catch (error) {
        console.error('Error hitting routing endpoint:', error.message);
    }
}
runVerification();
//# sourceMappingURL=verify-hardening.js.map