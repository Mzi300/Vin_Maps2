const axios = require('axios');
require('dotenv').config();

/**
 * Get traffic flow data from TomTom Traffic Flow API.
 * For simplicity we query the flow for a single point (the start location).
 * @param {{lat:number, lon:number}} point
 * @returns {Promise<Object>} traffic flow response data
 */
async function getTrafficFlow(point) {
  const apiKey = process.env.TOMTOM_API_KEY;
  const url = 'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json';
  const params = {
    key: apiKey,
    point: `${point.lat},${point.lon}`,
  };
  const resp = await axios.get(url, { params });
  return resp.data;
}

/**
 * Get traffic incidents data from TomTom Traffic Incidents API.
 * @param {string} bbox - bounding box string "minLat,minLon,maxLat,maxLon"
 * @returns {Promise<Object>} incidents response data
 */
async function getIncidents(bbox) {
  const apiKey = process.env.TOMTOM_API_KEY;
  const url = 'https://api.tomtom.com/traffic/incident/7/9/json';
  const params = {
    key: apiKey,
    bbox,
  };
  const resp = await axios.get(url, { params });
  return resp.data;
}

module.exports = { getTrafficFlow, getIncidents };
