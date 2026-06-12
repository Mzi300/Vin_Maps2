import axios from 'axios';

const API_URL = 'http://localhost:3000/routing/smart?start=37.7749,-122.4194&end=37.8044,-122.2712';

async function runVerification() {
  console.log('Testing Phase 2D Arbitration Pipeline...');
  
  try {
    const response = await axios.get(API_URL);
    console.log('--- TOP ROUTE ---');
    
    const topRoute = response.data.routes[0];
    console.log(JSON.stringify(topRoute, null, 2));

    if (topRoute.explanation) {
      console.log('✅ Explanation Generation Active:', topRoute.explanation);
    } else {
      console.error('❌ Explanation Generation Missing');
    }

    if (topRoute.arbitrationDetails) {
      console.log('✅ Arbitration Logic Active');
      console.log('   - Dominant Factor:', topRoute.arbitrationDetails.dominantFactor);
      console.log('   - Weights:', JSON.stringify(topRoute.arbitrationDetails.weights));
    } else {
      console.error('❌ Arbitration Logic Missing');
    }

  } catch (error: any) {
    console.error('Error hitting routing endpoint:', error.message);
  }
}

runVerification();
