const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 45, checkperiod: 60 }); // 45 sec TTL

const { getRoute } = require('../services/tomtomRouting');
const { getTrafficFlow, getIncidents } = require('../services/tomtomTraffic');
const { mergeRouteData } = require('../utils/mergeRouteData');

// Helper to build cache key
function buildCacheKey(start, destination) {
  return `${start.lat},${start.lon}->${destination.lat},${destination.lon}`;
}

router.post('/route', async (req, res) => {
  const { start, destination } = req.body;
  if (!start || !destination || typeof start.lat !== 'number' || typeof start.lon !== 'number' || typeof destination.lat !== 'number' || typeof destination.lon !== 'number') {
    return res.status(400).json({ error: 'Invalid start or destination coordinates' });
  }
  const cacheKey = buildCacheKey(start, destination);
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  try {
    const routeData = await getRoute(start, destination);
    // Traffic flow for start point (simple example)
    const trafficFlow = await getTrafficFlow(start);
    // Incidents for bounding box covering both points
    const bbox = `${start.lat},${start.lon},${destination.lat},${destination.lon}`;
    const incidents = await getIncidents(bbox);
    const merged = mergeRouteData(routeData, trafficFlow, incidents);
    cache.set(cacheKey, merged);
    res.json(merged);
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Failed to compute route' });
  }
});

module.exports = router;
