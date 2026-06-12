const axios = require('axios');
require('dotenv').config();

/**
 * Get routing information from TomTom Routing API.
 * @param {{lat:number, lon:number}} start
 * @param {{lat:number, lon:number}} destination
 * @returns {Promise<Object>} route data (first route from response)
 */
async function getRoute(start, destination) {
  const apiKey = process.env.TOMTOM_API_KEY;
  const points = `${start.lat},${start.lon}:${destination.lat},${destination.lon}`;
  const url = 'https://api.tomtom.com/routing/1/calculateRoute/json';
  const params = {
    key: apiKey,
    traffic: true,
    travelMode: 'car',
    routeRepresentation: 'polyline',
    computeTravelTimeFor: 'all',
    instruction: false,
    avoid: 'tollRoads',
    points,
  };
  const resp = await axios.get(url, { params });
  if (!resp.data || !resp.data.routes || resp.data.routes.length === 0) {
    throw new Error('No route returned from TomTom');
  }
  return resp.data.routes[0];
}

module.exports = { getRoute };
