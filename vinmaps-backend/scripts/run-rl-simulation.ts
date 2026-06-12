import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3000/routing/complete-trip';
const DEBUG_URL = 'http://localhost:3000/ai/debug/model-state';

const TOTAL_TRIPS = 150;

async function runSimulation() {
  console.log('Starting RL Simulation...');
  
  let currentEtaBias = 0;

  for (let i = 0; i < TOTAL_TRIPS; i++) {
    // Dynamically fetch current learned ETA bias from backend to test convergence
    try {
      const debug = await axios.get(DEBUG_URL);
      currentEtaBias = debug.data.etaGlobalBias || 0;
    } catch (e) {}

    const scenario = Math.random();
    let predictedEta = 20;
    let actualEta = 20;
    let predictedSafetyScore = 90;
    let distanceKm = 10;
    
    if (scenario < 0.33) {
      predictedEta = 25 + currentEtaBias; // Add bias
      actualEta = 35 + Math.floor(Math.random() * 5); // 35-39
      predictedSafetyScore = 75;
    } else if (scenario < 0.66) {
      predictedEta = 20 + currentEtaBias;
      actualEta = 20 + Math.floor(Math.random() * 3) - 1; // 19-22
      predictedSafetyScore = 90;
    } else {
      predictedEta = 40 + currentEtaBias;
      actualEta = 38 + Math.floor(Math.random() * 2); // 38-39
      predictedSafetyScore = 95;
      distanceKm = 25;
    }

    const payload = {
      routeId: randomUUID(),
      startTime: new Date(Date.now() - actualEta * 60000).toISOString(),
      endTime: new Date().toISOString(),
      distanceKm,
      predictedEtaMinutes: Math.round(predictedEta),
      predictedSafetyScore,
      actualEvents: [],
      congestionLevel: scenario < 0.33 ? 3 : 1,
      routeScoreInputs: { ruleBasedScore: predictedSafetyScore, mlScore: 0 }
    };

    try {
      await axios.post(API_URL, payload);
    } catch (e: any) {
      console.error(`Failed trip ${i}:`, e.message);
    }
  }

  console.log('Simulation complete. Fetching final AI State...');
  try {
    const debug = await axios.get(DEBUG_URL);
    console.log(JSON.stringify(debug.data, null, 2));
  } catch (e: any) {
    console.error('Failed to get debug state:', e.message);
  }
}

runSimulation();
