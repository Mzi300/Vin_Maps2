import axios from 'axios';

const API_URL = 'http://localhost:3000/routing/smart?start=37.7749,-122.4194&end=37.8044,-122.2712';

async function runVerification() {
  console.log('Testing Phase 2C Predictive Pipeline...');
  
  try {
    const response = await axios.get(API_URL);
    console.log('--- ROUTING RESPONSE ---');
    console.log(JSON.stringify(response.data.routes, null, 2));

    const topRoute = response.data.routes[0];
    if (topRoute.confidenceScore !== undefined) {
      console.log('✅ Confidence Scoring Active:', topRoute.confidenceScore);
    } else {
      console.error('❌ Confidence Scoring Missing');
    }

    if (topRoute.congestionForecast !== undefined) {
      console.log('✅ Congestion Forecasting Active:', topRoute.congestionForecast);
    } else {
      console.error('❌ Congestion Forecasting Missing');
    }

    if (topRoute.anomalyFlags !== undefined) {
      console.log('✅ Anomaly Detection Active:', topRoute.anomalyFlags);
    } else {
      console.error('❌ Anomaly Detection Missing');
    }

  } catch (error: any) {
    console.error('Error hitting routing endpoint:', error.message);
  }
}

runVerification();
