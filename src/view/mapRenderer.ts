import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { intelligence } from '../engine/intelligenceManager';
import { VisualEffects } from './visualEffects';

export class MapRenderer {
  private containerId: string;
  public map!: mapboxgl.Map;
  public visualEffects!: VisualEffects;
  private animationId: number | null = null;

  constructor(containerId: string, token: string) {
    this.containerId = containerId;
    this.initMap(token);
  }

  private initMap(token: string) {
    mapboxgl.accessToken = token;
    
    // 1. Initialize with Mapbox Standard for Photo-Realistic 3D
    this.map = new mapboxgl.Map({
      container: this.containerId,
      style: 'mapbox://styles/mapbox/standard',
      center: [28.0473, -26.2041],
      zoom: 16.5,
      pitch: 70,
      bearing: -17.6,
      antialias: true,
      interactive: true,
      maxBounds: [
        [16.3449, -34.8191],
        [32.8912, -22.1265]
      ]
    });

    this.map.on('style.load', () => {
      this.visualEffects = new VisualEffects(this.map);

      // 2. Set Cinematic Lighting (Dusk Mode for texture depth)
      this.map.setConfigProperty('basemap', 'lightPreset', 'dusk');
      this.map.setConfigProperty('basemap', 'showLandmarks', true);
      this.map.setConfigProperty('basemap', 'show3dObjects', true);

      // 3. Re-Inject High-Visibility Tactical Roads on top of Standard
      this.injectTacticalRoads();

      // 4. Atmosphere Tuning
      this.map.setFog({
        'range': [0.5, 4],
        'color': '#050505',
        'high-color': '#00f2ff',
        'space-color': '#000000',
        'horizon-blend': 0.05
      });
      
      // 5. Stylize Labels to match reference (Floating/Glowing)
      this.stylizeLabels();
    });

    this.map.on('load', () => {
      this.startRotation();
      this.map.on('mousedown', () => this.stopRotation());
      this.map.on('wheel', () => this.stopRotation());
      this.map.on('touchstart', () => this.stopRotation());
      
      // 6. Interactive POIs
      this.map.on('click', 'poi-label', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties as any;
        const name = props.name || "Target Objective";
        const category = props.category_en || "Urban Node";
        
        this.emitPoiIntelligence(name, category, feature.geometry);
      });

      // Change cursor on hover
      this.map.on('mouseenter', 'poi-label', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'poi-label', () => {
        this.map.getCanvas().style.cursor = '';
      });
    });

    intelligence.on('intelligence-update', (update: any) => this.addTacticalMarker(update));
  }

  private emitPoiIntelligence(name: string, category: string, geometry: any) {
    const event = new CustomEvent('poi-intelligence', {
      detail: { name, category, location: (geometry as any).coordinates }
    });
    window.dispatchEvent(event);
  }

  public setPoiFilter(category: string) {
    const layers = this.map.getStyle().layers;
    layers.forEach(layer => {
      if (layer.id.includes('poi') || layer.id.includes('landmark')) {
        try {
          if (category === 'all') {
            this.map.setFilter(layer.id, null);
            this.map.setPaintProperty(layer.id, 'icon-opacity', 1);
            this.map.setPaintProperty(layer.id, 'text-opacity', 1);
          } else {
            // Check if the layer supports filtering by category
            // Standard POI categories: 'restaurant', 'hotel', 'museum', etc.
            this.map.setFilter(layer.id, ['==', ['get', 'category_en'], category]);
          }
        } catch (e) {}
      }
    });
  }

  private injectTacticalRoads() {
    // We'll use a safer approach to style existing layers
    const layers = this.map.getStyle().layers;
    
    // Find layers that contain 'road', 'water', 'land' in their ID
    layers.forEach(layer => {
      try {
        if (layer.id.includes('road')) {
          this.map.setPaintProperty(layer.id, 'line-color', '#050505');
        }
        if (layer.id.includes('water')) {
          this.map.setPaintProperty(layer.id, 'fill-color', '#0000ff');
        }
        if (layer.id.includes('land') || layer.id.includes('park') || layer.id.includes('green')) {
          this.map.setPaintProperty(layer.id, 'fill-color', layer.id.includes('land') ? '#4b3621' : '#00ff00');
        }
      } catch (e) {
        // Some layers might not support these properties or are part of components
      }
    });

    this.addSafetyIntelligenceLayer();
  }

  private addSafetyIntelligenceLayer() {
    // Add a glowing "Safe Corridor" or "Heatmap"
    // Starts empty, will be populated along the route dynamically if needed
    this.map.addSource('safety-intel', {
      'type': 'geojson',
      'data': {
        'type': 'FeatureCollection',
        'features': []
      }
    });

    this.map.addLayer({
      'id': 'safety-heatmap',
      'type': 'heatmap',
      'source': 'safety-intel',
      'paint': {
        'heatmap-weight': ['get', 'intensity'],
        'heatmap-intensity': 1,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0, 242, 255, 0)',
          0.5, 'rgba(0, 242, 255, 0.2)',
          1, 'rgba(0, 242, 255, 0.5)'
        ],
        'heatmap-radius': 50
      }
    });
  }

  private stylizeLabels() {
    const layers = this.map.getStyle().layers;
    layers.forEach(layer => {
      if (layer.type === 'symbol') {
        try {
          this.map.setPaintProperty(layer.id, 'text-color', '#00f2ff');
          this.map.setPaintProperty(layer.id, 'text-halo-color', '#000000');
          this.map.setPaintProperty(layer.id, 'text-halo-width', 2);
        } catch (e) {}
      }
    });
  }

  private startRotation() {
    if (!this.animationId) this.animationId = requestAnimationFrame((t) => this.rotateCamera(t));
  }

  private stopRotation() {
    if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
  }

  private rotateCamera(timestamp: number) {
    this.map.rotateTo((timestamp / 500) % 360, { duration: 0 });
    this.animationId = requestAnimationFrame((t) => this.rotateCamera(t));
  }

  private addTacticalMarker(update: any) {
    const el = document.createElement('div');
    el.style.cssText = `width:16px; height:16px; background:${update.severity === 'critical' ? '#ff0000' : '#00f2ff'}; border-radius:50%; box-shadow:0 0 15px rgba(255,255,255,0.5); border: 2px solid white;`;
    new mapboxgl.Marker(el).setLngLat(update.location).addTo(this.map);
  }

  public flyTo(lng: number, lat: number) {
    this.stopRotation();
    this.map.flyTo({ center: [lng, lat], zoom: 17, pitch: 75, speed: 0.6, curve: 1.2, essential: true });
    this.map.once('moveend', () => this.startRotation());
  }

  public executeCameraSequence(origin: [number, number], destination: [number, number], routeCoords?: [number, number][]) {
    this.stopRotation();

    // Trigger Visual Effects Route Drawing
    if (this.visualEffects) {
      this.visualEffects.drawGlowingRoute(origin, destination, routeCoords);
    }

    // STEP 1 & 2: ROUTE INITIALIZATION & VISUALIZATION
    // Automatically zoom out to fit entire route in viewport (bounding box)
    const bounds = new mapboxgl.LngLatBounds();
    if (routeCoords && routeCoords.length > 0) {
      routeCoords.forEach(coord => bounds.extend(coord));
    } else {
      bounds.extend(origin).extend(destination);
    }

    this.map.fitBounds(bounds, { padding: 100, pitch: 30, bearing: 0, duration: 1500 });
    
    this.map.once('moveend', () => {
      // Calculate initial bearing if route coordinates are available
      let initialBearing = 45;
      if (routeCoords && routeCoords.length >= 2) {
        const start = routeCoords[0];
        const next = routeCoords[1];
        const dx = next[0] - start[0];
        const dy = next[1] - start[1];
        initialBearing = (Math.atan2(dx, dy) * 180) / Math.PI;
      }

      setTimeout(() => {
        this.map.flyTo({
          center: origin,
          zoom: 18.5,
          pitch: 75,
          bearing: initialBearing,
          speed: 0.8,
          curve: 1.4,
          essential: true
        });
      }, 300);
    });
  }



  public forceTacticalMode() {
    this.map.easeTo({ pitch: 80, bearing: 0, zoom: 17, duration: 2000 });
  }
}
