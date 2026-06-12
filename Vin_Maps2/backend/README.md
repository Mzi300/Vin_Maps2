# VinMaps Backend – Setup & Run Guide

This guide explains how to install, run, and test the VinMaps backend routing system.

------------------------------------------------------------
1️⃣ CREATE .env FILE
------------------------------------------------------------

Run this command:

```bash
cp backend/.env.example backend/.env
```

Then open:

`backend/.env`

Add your TomTom API key:

```dotenv
TOMTOM_API_KEY=your_actual_tomtom_api_key
```

------------------------------------------------------------
2️⃣ INSTALL DEPENDENCIES
------------------------------------------------------------

```bash
cd backend
npm install
```

Installed packages:
- express → backend server
- axios → API requests
- dotenv → environment variables
- node-cache → caching system

------------------------------------------------------------
3️⃣ RUN BACKEND SERVER
------------------------------------------------------------

```bash
npm run dev
```

Expected output:
```
VinMaps backend listening on port 4000
```

Server URL:
`http://localhost:4000`

------------------------------------------------------------
4️⃣ TEST API ENDPOINT
------------------------------------------------------------

```bash
curl -X POST http://localhost:4000/api/route \
     -H "Content-Type: application/json" \
     -d '{
       "start": { "lat": -26.2041, "lon": 28.0473 },
       "destination": { "lat": -26.1700, "lon": 28.0450 }
     }'
```

Expected response:

```json
{
  "route": {
    "geometry": "...",
    "distance": 12345,
    "travelTime": 678,
    "congestionDelay": 45
  },
  "traffic": {
    "flow": {},
    "incidents": []
  },
  "analysis": {
    "hasHeavyTraffic": false,
    "incidentCount": 0,
    "routeHealthScore": 100
  }
}
```

------------------------------------------------------------
5️⃣ CREATE MISSING FILE
------------------------------------------------------------

File path:
`backend/src/utils/mergeRouteData.js`

CODE:

```js
function mergeRouteData(route, trafficFlow, incidents) {
  return {
    route: {
      geometry: route.geometry,
      distance: route.summary?.lengthInMeters || 0,
      travelTime: route.summary?.travelTimeInSeconds || 0,
      congestionDelay: route.summary?.trafficDelayInSeconds || 0
    },

    traffic: {
      flow: trafficFlow || null,
      incidents: incidents?.incidents || []
    },

    analysis: {
      hasHeavyTraffic: (route.summary?.trafficDelayInSeconds || 0) > 300,
      incidentCount: incidents?.incidents?.length || 0,
      routeHealthScore: calculateRouteScore(route, incidents)
    }
  };
}

function calculateRouteScore(route, incidents) {
  let score = 100;

  const delay = route.summary?.trafficDelayInSeconds || 0;
  const incidentCount = incidents?.incidents?.length || 0;

  if (delay > 300) score -= 20;
  if (delay > 600) score -= 40;

  score -= incidentCount * 10;

  if (score < 0) score = 0;

  return score;
}

module.exports = { mergeRouteData };
```

------------------------------------------------------------
6️⃣ WHAT THIS SYSTEM DOES
------------------------------------------------------------

- Combines routing + traffic + incidents into one response
- Generates route intelligence scoring
- Provides clean API output for frontend
- Forms foundation for VinMaps AI navigation layer

------------------------------------------------------------
7️⃣ SYSTEM FLOW
------------------------------------------------------------

VinMaps Frontend
↓
VinMaps Backend (Node.js + Express)
↓
TomTom Routing API
TomTom Traffic Flow API
TomTom Traffic Incidents API
↓
mergeRouteData()
↓
Clean navigation response

------------------------------------------------------------
8️⃣ NEXT STEPS
------------------------------------------------------------

- Test multiple routes
- Improve error handling
- Add caching optimization
- Split backend services
- Connect frontend map (Mapbox / MapLibre)
- Build VinMaps Intel layer (future expansion)

------------------------------------------------------------
9️⃣ FINAL GOAL
------------------------------------------------------------

Build a production-ready navigation backend that:
- Generates optimal routes
- Responds to real-time traffic
- Detects road incidents
- Returns structured navigation data
- Powers VinMaps future system expansion
