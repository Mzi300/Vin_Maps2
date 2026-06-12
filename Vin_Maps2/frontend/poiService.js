// poiService.js – simple wrapper over the backend POI API

const API_KEY = 'MrQr5OnYjebZqtvrelvXolJfMHxt4TYq';
const BASE_URL = 'http://localhost:3000';

/**
 * Get clustered POIs for a given viewport.
 * @param {number} zoom - current map zoom level
 * @param {Array<number>} bbox - [minLon, minLat, maxLon, maxLat]
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchClusters(zoom, bbox) {
  const url = `${BASE_URL}/api/pois/cluster?z=${zoom}&bbox=${bbox.join(',')}`;
  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
  });
  if (!res.ok) throw new Error('Failed to fetch clusters');
  return res.json(); // GeoJSON
}

/**
 * Get a single POI by ID (used when user clicks a marker).
 */
export async function fetchPoiById(id) {
  const url = `${BASE_URL}/api/pois/${id}`;
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) throw new Error('Failed to fetch POI');
  return res.json();
}

/**
 * Request a route between two coordinates.
 */
export async function requestRoute(origin, destination) {
  const url = `${BASE_URL}/api/route`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ origin, destination }),
  });
  if (!res.ok) throw new Error('Failed to calculate route');
  return res.json();
}
