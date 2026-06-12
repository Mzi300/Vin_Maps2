// backend/src/routes/routeRouter.ts
import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch'; // using node-fetch; ensure it's in deps

const router = Router();

// Expected body: { origin: [lon, lat], destination: [lon, lat], profile?: 'driving'|'walking'|'cycling', stops?: [[lon, lat]], avoid?: string }
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, stops = [], profile = 'driving', avoid = '' } = req.body;
    if (!origin || !destination || origin.length !== 2 || destination.length !== 2) {
      return res.status(400).json({ error: 'Invalid origin/destination format. Expected [lon, lat].' });
    }
    // Build coordinates string: origin; stops...; destination
    const allPoints = [origin, ...stops, destination];
    const coordinates = allPoints.map(p => `${p[0]},${p[1]}`).join(';');
    if (!origin || !destination || origin.length !== 2 || destination.length !== 2) {
      return res.status(400).json({ error: 'Invalid origin/destination format. Expected [lon, lat].' });
    }
    const token = process.env.MAPBOX_TOKEN;
    const region = process.env.MAP_REGION || 'ZA';
    const avoidParam = avoid ? `&avoid=${avoid}` : '';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&overview=full${avoidParam}&country=${region}&access_token=${token}`;
    const response = await fetch(url);
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Mapbox API error: ${response.status} ${txt}`);
    }
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({ error: 'No route found.' });
    }
    const route = data.routes[0];
    // Build a minimal GeoJSON FeatureCollection with the route geometry
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            distance: route.distance,
            duration: route.duration,
            profile,
          },
          geometry: route.geometry,
        },
      ],
    };
    const route = data.routes[0];
    // Build a minimal GeoJSON FeatureCollection with the route geometry and steps
    const steps = route.legs?.[0]?.steps?.map((step: any) => ({
      distance: step.distance,
      duration: step.duration,
      geometry: step.geometry,
      instruction: step.maneuver?.instruction || ''
    })) || [];
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            distance: route.distance,
            duration: route.duration,
            profile,
            steps,
          },
          geometry: route.geometry,
        },
      ],
    };
    res.json(geojson);
  } catch (err) {
    next(err);
  }
});

export default router;
