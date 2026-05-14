import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { intelligence } from '../engine/intelligenceManager';
import { VisualEffects } from './visualEffects';
import { NavigationCameraController, CameraMode } from './navigationCameraController';

export class MapRenderer {
  private containerId: string;
  public map!: mapboxgl.Map;
  public visualEffects!: VisualEffects;
  public cameraController!: NavigationCameraController;
  private styleLoadedPromise: Promise<void>;
  private resolveStyleLoaded!: () => void;
  private isNavigationMode: boolean = false;

  private styleLoaded: boolean = false;
  private initialCenter: [number, number] = [28.0473, -26.2041];

  constructor(containerId: string, token: string, center?: [number, number]) {
    this.containerId = containerId;
    if (center) this.initialCenter = center;
    this.styleLoadedPromise = new Promise(resolve => this.resolveStyleLoaded = resolve);
    this.initMap(token);
  }

  /** --------------------------------------------------------------
   *  Initialise the Mapbox map
   *  -------------------------------------------------------------- */
  private initMap(token: string) {
    mapboxgl.accessToken = token;

    // 1. Initialise with Mapbox Standard for photo‑realistic 3D
    this.map = new mapboxgl.Map({
      container: this.containerId,
      style: 'mapbox://styles/mapbox/standard',
      center: this.initialCenter, // Tactical center
      zoom: 16.2,                  // Tightened cinematic zoom
      pitch: 68,                   // Tightened cinematic perspective
      bearing: 0,                  // Forward facing

      antialias: true,
      interactive: true,
      maxBounds: [
        [16.3449, -34.8191],
        [32.8912, -22.1265]
      ]
    });

    this.map.on('style.load', () => {
      this.visualEffects = new VisualEffects(this.map);
      this.cameraController = new NavigationCameraController(this.map);

      // 2. Cinematic lighting (dusk)
      this.map.setConfigProperty('basemap', 'lightPreset', 'dusk');
      this.map.setConfigProperty('basemap', 'showLandmarks', true);
      this.map.setConfigProperty('basemap', 'show3dObjects', true);

      // 3. Tactical road overlay
      this.injectTacticalRoads();

      // 4. Atmosphere (fog)
      this.map.setFog({
        range: [0.5, 4],
        color: '#050505',
        'high-color': '#00f2ff',
        'space-color': '#000000',
        'horizon-blend': 0.05
      });

      // 5. Stylised label appearance
      this.stylizeLabels();

      // 6. Smooth Zoom Tuning
      this.map.scrollZoom.setWheelZoomRate(1/600); 
      this.map.scrollZoom.setZoomRate(1/600);

      this.styleLoaded = true;
      this.resolveStyleLoaded();
    });

    this.map.on('load', () => {
      // Cancel rotation on user interaction
      this.map.on('mousedown', () => {
        if (this.cameraController) this.cameraController.setMode(CameraMode.FREE_EXPLORE);
      });
      this.map.on('wheel', () => {
        if (this.cameraController) this.cameraController.setMode(CameraMode.FREE_EXPLORE);
      });
      this.map.on('touchstart', () => {
        if (this.cameraController) this.cameraController.setMode(CameraMode.FREE_EXPLORE);
      });

      // 6. Interactive POIs
      this.map.on('click', 'poi-label', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties as any;
        const name = props.name || 'Target Objective';
        const category = props.category_en || 'Urban Node';
        this.emitPoiIntelligence(name, category, feature.geometry);
      });

      // Cursor hover effects
      this.map.on('mouseenter', 'poi-label', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'poi-label', () => {
        this.map.getCanvas().style.cursor = '';
      });
    });

    // Global intelligence updates
    intelligence.on('intelligence-update', (update: any) => this.addTacticalMarker(update));
  }

  /** --------------------------------------------------------------
   *  Helper to broadcast POI intelligence events
   *  -------------------------------------------------------------- */
  private emitPoiIntelligence(name: string, category: string, geometry: any) {
    const event = new CustomEvent('poi-intelligence', {
      detail: { name, category, location: (geometry as any).coordinates }
    });
    window.dispatchEvent(event);
  }

  /** --------------------------------------------------------------
   *  POI layer filter
   *  -------------------------------------------------------------- */
  public setPoiFilter(category: string) {
    if (this.visualEffects) {
      this.visualEffects.setPoiFilter(category === 'all' ? null : category);
    }
  }

  /** --------------------------------------------------------------
   *  Tactical road styling
   *  -------------------------------------------------------------- */
  private injectTacticalRoads() {
    const layers = this.map.getStyle().layers;
    layers.forEach(layer => {
      try {
        if (layer.id.includes('road')) {
          this.map.setPaintProperty(layer.id, 'line-color', '#050505');
        }
        if (layer.id.includes('water')) {
          this.map.setPaintProperty(layer.id, 'fill-color', '#0000ff');
        }
        if (layer.id.includes('land') || layer.id.includes('park') || layer.id.includes('green')) {
          this.map.setPaintProperty(
            layer.id,
            'fill-color',
            layer.id.includes('land') ? '#4b3621' : '#00ff00'
          );
        }
      } catch (e) {}
    });

    this.addSafetyIntelligenceLayer();
  }

  /** --------------------------------------------------------------
   *  Safety heat‑map layer
   *  -------------------------------------------------------------- */
  private addSafetyIntelligenceLayer() {
    this.map.addSource('safety-intel', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'safety-heatmap',
      type: 'heatmap',
      source: 'safety-intel',
      paint: {
        'heatmap-weight': ['get', 'intensity'],
        'heatmap-intensity': 1,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0, 242, 255, 0)',
          0.5,
          'rgba(0, 242, 255, 0.2)',
          1,
          'rgba(0, 242, 255, 0.5)'
        ],
        'heatmap-radius': 50
      }
    });
  }

  /** --------------------------------------------------------------
   *  Label appearance
   *  -------------------------------------------------------------- */
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

  /** --------------------------------------------------------------
   *  Tactical marker UI
   *  -------------------------------------------------------------- */
  public addTacticalMarker(update: any) {
    const el = document.createElement('div');
    el.style.cssText = `width:16px; height:16px; background:${
      update.severity === 'critical' ? '#ff0000' : '#00f2ff'
    }; border-radius:50%; box-shadow:0 0 15px rgba(255,255,255,0.5); border: 2px solid white;`;
    new mapboxgl.Marker(el).setLngLat(update.location).addTo(this.map);
  }

  /** --------------------------------------------------------------
   *  Camera flight helpers
   *  -------------------------------------------------------------- */
  public flyTo(lng: number, lat: number, zoom: number = 18.5) {
    // Locked
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      pitch: 68, 
      speed: 1.0, 
      curve: 1.0,
      essential: true
    });
  }

  /** --------------------------------------------------------------
   *  Execute full navigation camera sequence
   *  -------------------------------------------------------------- */
  public async executeCameraSequence(
    origin: [number, number],
    destination: [number, number],
    routeCoords?: [number, number][]
  ) {
    await this.styleLoadedPromise;
    if (this.visualEffects) {
      this.visualEffects.drawGlowingRoute(origin, destination, routeCoords);
    }
    const bounds = new mapboxgl.LngLatBounds();
    if (routeCoords && routeCoords.length > 0) {
      routeCoords.forEach(coord => bounds.extend(coord));
    } else {
      bounds.extend(origin).extend(destination);
    }

    // 1. Calculate Initial Bearing to face the road immediately
    let initialBearing = 0;
    if (routeCoords && routeCoords.length >= 2) {
      const start = routeCoords[0];
      const next = routeCoords[1];
      // Mapbox bearing: atan2(dx, dy)
      initialBearing = (Math.atan2(next[0] - start[0], next[1] - start[1]) * 180) / Math.PI;
    }

    // 2. Immediate Focus: Fly to origin facing the correct direction
    this.map.flyTo({
      center: origin,
      zoom: 19.5,
      pitch: 80,
      bearing: initialBearing,
      duration: 1200, 
      essential: true
    });

    this.map.once('moveend', () => {
      this.resetCameraState(origin, initialBearing);
      this.enterNavigationMode();
      
      this.map.easeTo({
        center: origin,
        zoom: 16.2,
        pitch: 68,
        bearing: initialBearing,
        duration: 50 // Near instant
      });
    });
  }

  public resetCameraState(coords: [number, number], heading: number) {
    if (this.cameraController) {
      this.cameraController.update(coords, heading, 0, true);
    }
  }

  /** --------------------------------------------------------------
   *  Tactical mode helper
   *  -------------------------------------------------------------- */
  public forceTacticalMode() {
    this.map.easeTo({ pitch: 80, bearing: 0, zoom: 17, duration: 2000 });
  }

  /** --------------------------------------------------------------
   *  Navigation mode toggles
   *  -------------------------------------------------------------- */
  public enterNavigationMode() {
    this.isNavigationMode = true;
    if (this.cameraController) {
      this.cameraController.setMode(CameraMode.DRIVING);
    }
  }

  public exitNavigationMode() {
    this.isNavigationMode = false;
    if (this.cameraController) {
      this.cameraController.setMode(CameraMode.OVERVIEW);
    }
  }

  public recenter() {
    if (this.cameraController) {
      this.cameraController.recenter();
    }
  }

  /** --------------------------------------------------------------
   *  updateCameraForNav – called each navigation frame
   *  -------------------------------------------------------------- */
  public updateCameraForNav(
    coords: [number, number],
    heading: number,
    speed: number,
    _minZoom: number = 15.5,
    _maxZoom: number = 19
  ) {
    if (!this.isNavigationMode) return;

    if (this.cameraController) {
      this.cameraController.update(coords, heading, speed);
    }
  }

  public updateTrafficSignals(_signals: any[]) {
    // Placeholder for signal logic
  }

  public updateRoute(route: any) {
    if (this.visualEffects) {
      this.visualEffects.drawGlowingRoute(route.coordinates[0], route.coordinates[route.coordinates.length - 1], route.coordinates);
    }
  }
}
