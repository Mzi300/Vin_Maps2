import axios from 'axios';

const API_URL = 'http://localhost:3000/routing/smart?start=37.7749,-122.4194&end=37.8044,-122.2712';

async function runVerification() {
  console.log('--- Testing Phase 2D+ Hardening ---');
  
  try {
    console.log('Sending first request...');
    const res1 = await axios.get(API_URL);
    console.log(`Response 1 systemMode: ${res1.data.routes[0].systemMode}`);
    
    console.log('Sending second request immediately (should hit cache)...');
    const res2 = await axios.get(API_URL);
    console.log(`Response 2 systemMode: ${res2.data.routes[0].systemMode}`);
    
    if (res1.data.routes[0].systemMode === 'DEGRADED') {
      console.log('✅ DEGRADED Fallback Mode Active!');
      console.log('   - Explanation:', res1.data.routes[0].explanation);
    }

  } catch (error: any) {
    console.error('Error hitting routing endpoint:', error.message);
  }
}

runVerification();
