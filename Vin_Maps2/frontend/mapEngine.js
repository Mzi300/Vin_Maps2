// mapEngine.js – a lightweight wrapper around MapLibre exposing the required contract
// This file is loaded after the MapLibre CDN script in index.html.

class MapEngine {
  constructor(containerId, options = {}) {
    // Create the map with drag enabled (default) and other sane defaults
    this.map = new maplibregl.Map({
      container: containerId,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 0],
      zoom: 2,
      dragPan: true, // enable mouse‑drag navigation (will be reinforced on load)
      scrollZoom: true,
      interactive: true,
      ...options,
    });
    // No immediate calls here – they'll be performed after the map is ready
    this.map.on("load", () => {
      // Ensure interaction handlers are active (some CSS/layout changes can reset them)
      this.map.dragPan.enable();
      this.map.scrollZoom.enable();
      console.log('dragPan enabled?', this.map.dragPan.isEnabled());
      console.log('scrollZoom enabled?', this.map.scrollZoom.isEnabled());
      this._emit("onMapReady");
    });
    this.map.on("move", () => {
      const cam = this.map.getCenter();
      const zoom = this.map.getZoom();
      this._emit("onCameraMove", { lat: cam.lat, lon: cam.lng, zoom });
    });
    this.map.on("click", (e) => this._emit("onMapClick", e));
  }

  // Simple event system – listeners are stored in a map of arrays
  _emit(event, payload) {
    if (this._listeners && this._listeners[event]) {
      this._listeners[event].forEach((cb) => cb(payload));
    }
  }
  on(event, cb) {
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  // ---- Contract methods -------------------------------------------------
  flyTo(center, zoom) {
    this.map.flyTo({ center, zoom });
  }

  drawRoute(polyline) {
    // Remove any existing route first
    this.clearRoute();
    const coordinates = polyline.split(";").map((pt) => pt.split(",").map(Number));
    this.map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    });
    this.map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#ff6600",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });
    this._emit("onRouteCalculated");
  }

  clearRoute() {
    if (this.map.getLayer("route")) this.map.removeLayer("route");
    if (this.map.getSource("route")) this.map.removeSource("route");
  }

  // Add a route layer from GeoJSON data
  addRouteLayer(geojson) {
    // Remove existing route first
    this.clearRoute();
    // Add new source
    this.map.addSource("route", {
      type: "geojson",
      data: geojson,
    });
    // Add layer if not already present
    this.map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#ff6600",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });
    this._emit("onRouteCalculated");
  }

  setMode(mode) {
    // mode is either "EXPLORE" or "NAVIGATION" – we simply emit the event
    this._emit("onModeChange", mode);
  }

  addClusterSource(data) {
    this.removeClusterSource();
    this.map.addSource("clusters", { type: "geojson", data, cluster: true, clusterRadius: 50 });
    this.map.addLayer({
      id: "cluster-circles",
      type: "circle",
      source: "clusters",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#ffa500",
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      },
    });
    this.map.addLayer({
      id: "cluster-points",
      type: "symbol",
      source: "clusters",
      filter: ["!", ["has", "point_count"]],
      layout: { "icon-image": "marker-15", "icon-allow-overlap": true },
    });
    this._emit("onClusterAdded");
  }

  removeClusterSource() {
    if (this.map.getLayer("cluster-circles")) this.map.removeLayer("cluster-circles");
    if (this.map.getLayer("cluster-points")) this.map.removeLayer("cluster-points");
    if (this.map.getSource("clusters")) this.map.removeSource("clusters");
    this._emit("onClusterRemoved");
  }
  // -----------------------------------------------------------------
  // Utility – query rendered features at a point (used for POI clicks)
  // Returns an array of GeoJSON features under the given screen pixel.
  queryFeatures(point) {
    return this.map.queryRenderedFeatures(point);
  }

  // Return the centre coordinate of a feature (Point or midpoint of LineString)
  getFeatureCenter(feature) {
    const geom = feature.geometry;
    if (!geom) return [0, 0];
    if (geom.type === 'Point') return geom.coordinates;
    if (geom.type === 'LineString') {
      const coords = geom.coordinates;
      const mid = Math.floor(coords.length / 2);
      return coords[mid];
    }
    // Fallback for other geometry types
    return [0, 0];
  }

  /**
   * Add a GeoJSON source containing POI points and a symbol layer.
   * @param {GeoJSON.FeatureCollection} data
   */
  addPoiSource(data) {
    // Remove any existing POI source first
    this.clearPoiSource();
    this.map.addSource('pois', { type: 'geojson', data });
    this.map.addLayer({
      id: 'pois-symbol',
      type: 'symbol',
      source: 'pois',
      layout: { 'icon-image': 'marker-15', 'icon-allow-overlap': true },
    });
    this._emit('onPoiSourceAdded');
  }

  /** Remove the POI source and its layer */
  clearPoiSource() {
    if (this.map.getLayer('pois-symbol')) this.map.removeLayer('pois-symbol');
    if (this.map.getSource('pois')) this.map.removeSource('pois');
    this._emit('onPoiSourceCleared');
  }
}

// Export to global scope so main.js can access it
window.MapEngine = MapEngine;

// Export to global scope so main.js can access it
window.MapEngine = MapEngine;
