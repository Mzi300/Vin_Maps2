# 🚗 VinMaps Navigation Engine (v1)

VinMaps is a real-time intelligent navigation backend system designed to generate optimal routes using live traffic data, incidents, and routing APIs.

This version of VinMaps focuses on building a production-ready navigation engine using Node.js, Express, and TomTom APIs.

---

## 🚀 Overview

VinMaps Navigation Engine provides:

- Real-time route calculation
- Traffic-aware navigation
- Incident detection and reporting
- Clean structured API responses for frontend mapping systems
- Foundation for future AI-powered “VinMaps Intel” layer

---

## 🧠 Core System Purpose

This system is designed to act as a backend navigation brain that:

- Calculates routes between two points
- Adjusts travel time based on live traffic conditions
- Detects road incidents and congestion
- Returns optimized routing intelligence to the frontend

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- Axios
- dotenv
- node-cache

### External APIs
- TomTom Routing API
- TomTom Traffic Flow API
- TomTom Traffic Incidents API

---

## ⚙️ System Architecture

VinMaps Frontend
↓
VinMaps Backend (Node.js + Express)
↓
TomTom Routing API
TomTom Traffic Flow API
TomTom Traffic Incidents API
↓
mergeRouteData() processing layer
↓
Structured navigation response

---

## 📦 Setup Instructions

### 1️⃣ Create .env file

```bash
cp backend/.env.example backend/.env






🛠️ Tech Stack

Backend:
- Node.js
- Express.js
- Axios
- dotenv
- node-cache

External APIs:
- TomTom Routing API
- TomTom Traffic Flow API
- TomTom Traffic Incidents API

---

⚙️ System Architecture

VinMaps Frontend
↓
VinMaps Backend (Node.js + Express)
↓
TomTom Routing API
TomTom Traffic Flow API
TomTom Traffic Incidents API
↓
mergeRouteData() processing layer
↓
Structured navigation response

---

📦 Setup Instructions

1️⃣ Create .env file

cp backend/.env.example backend/.env

Add API key:

TOMTOM_API_KEY=your_actual_tomtom_api_key

---

2️⃣ Install dependencies

cd backend
npm install

---

3️⃣ Run server

npm run dev

Server runs at:
http://localhost:4000

---

📡 API Endpoint

POST /api/route

Example request:

curl -X POST http://localhost:4000/api/route \
-H "Content-Type: application/json" \
-d '{
  "start": { "lat": -26.2041, "lon": 28.0473 },
  "destination": { "lat": -26.1700, "lon": 28.0450 }
}'

---

📥 Example Response

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

---

🧩 Core Features

- Real-time routing engine
- Traffic-aware navigation system
- Incident detection layer
- Route intelligence scoring
- Clean API structure for frontend use

---

📈 Current Status

✔ Backend implemented  
✔ Routing API working  
✔ Traffic integration active  
✔ Response merging layer created  
✔ Ready for deployment  

---

🚀 Next Steps

- Deploy backend to cloud (Render / Railway)
- Build simple map frontend (Leaflet / MapLibre)
- Connect frontend → backend API
- Create live demo for marketing
- Improve caching + performance
- Build VinMaps Intel layer (future upgrade)

---

🎯 Final Goal

VinMaps aims to become a real-time navigation intelligence system that:

- Generates optimal driving routes
- Responds dynamically to live traffic conditions
- Detects incidents in real time
- Provides structured navigation data for apps
- Powers advanced map-based applications

---

👨‍💻 Developer

Mzikayise Tshabalala  
Johannesburg, South Africa  
Full-Stack Developer (Junior)

---

END OF README