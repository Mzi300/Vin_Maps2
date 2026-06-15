"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/routing/smart?start=37.7749,-122.4194&end=37.8044,-122.2712';
async function runVerification() {
    console.log('Testing Phase 2C Predictive Pipeline...');
    try {
        const response = await axios_1.default.get(API_URL);
        console.log('--- ROUTING RESPONSE ---');
        console.log(JSON.stringify(response.data.routes, null, 2));
        const topRoute = response.data.routes[0];
        if (topRoute.confidenceScore !== undefined) {
            console.log('✅ Confidence Scoring Active:', topRoute.confidenceScore);
        }
        else {
            console.error('❌ Confidence Scoring Missing');
        }
        if (topRoute.congestionForecast !== undefined) {
            console.log('✅ Congestion Forecasting Active:', topRoute.congestionForecast);
        }
        else {
            console.error('❌ Congestion Forecasting Missing');
        }
        if (topRoute.anomalyFlags !== undefined) {
            console.log('✅ Anomaly Detection Active:', topRoute.anomalyFlags);
        }
        else {
            console.error('❌ Anomaly Detection Missing');
        }
    }
    catch (error) {
        console.error('Error hitting routing endpoint:', error.message);
    }
}
runVerification();
//# sourceMappingURL=verify-phase2c.js.map