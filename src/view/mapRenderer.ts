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
  private animationId: number | null = null;
  private isNavigationMode: boolean = false;

  constructor(containerId: string, token: string) {
    this.containerId = containerId;
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
      center: [28.0436, -26.2023],
      zoom: 16.2,
      pitch: 65,
      bearing: 0,

      antialias: true,
      interactive: true,
      maxBounds: [
        [16.3449, -34.8191],
        [32.8912, -22.1265]
      ]
    });

    this.map.on('style.load', () => {
      this.visualEffects = new VisualEffects(this.map, this);
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
    });

    this.map.on('load', () => {
      this.startRotation();

      // Cancel rotation on user interaction
      this.map.on('mousedown', () => this.stopRotation());
      this.map.on('wheel', () => this.stopRotation());
      this.map.on('touchstart', () => this.stopRotation());

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
    const layers = this.map.getStyle().layers;
    layers.forEach(layer => {
      if (layer.id.includes('poi') || layer.id.includes('landmark')) {
        try {
          if (category === 'all') {
            this.map.setFilter(layer.id, null);
            this.map.setPaintProperty(layer.id, 'icon-opacity', 1);
            this.map.setPaintProperty(layer.id, 'text-opacity', 1);
          } else {
            this.map.setFilter(layer.id, ['==', ['get', 'category_en'], category]);
          }
        } catch (e) {}
      }
    });
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
   *  Rotation (demo) helpers
   *  -------------------------------------------------------------- */
  private startRotation() {
    if (!this.animationId) this.animationId = requestAnimationFrame(t => this.rotateCamera(t));
  }

  private stopRotation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private rotateCamera(timestamp: number) {
    this.map.rotateTo((timestamp / 500) % 360, { duration: 0 });
    this.animationId = requestAnimationFrame(t => this.rotateCamera(t));
  }

  /** --------------------------------------------------------------
   *  Tactical marker UI
   *  -------------------------------------------------------------- */
  private addTacticalMarker(update: any) {
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
    this.stopRotation();
    // Locked
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      pitch: 75, // Windshield angle
      speed: 1.2, // Faster for immediate feel
      curve: 1.0,
      essential: true
    });
  }

  /** --------------------------------------------------------------
   *  Execute full navigation camera sequence
   *  -------------------------------------------------------------- */
  public executeCameraSequence(
    origin: [number, number],
    destination: [number, number],
    routeCoords?: [number, number][]
  ) {
    this.stopRotation();

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

    // Locked
    this.stopRotation();
    
    // 2. Immediate Focus: Fly to origin facing the correct direction
    this.map.flyTo({
      center: origin,
      zoom: 22.2,
      pitch: 82,
      bearing: initialBearing,
      duration: 800, // Faster transition
      essential: true
    });

    this.map.once('moveend', () => {
      this.resetCameraState(origin, initialBearing);
      this.enterNavigationMode();
      
      this.map.easeTo({
        center: origin,
        zoom: 22.2,
        pitch: 82,
        bearing: initialBearing,
        duration: 50 // Near instant
      });

      this.map.once('moveend', () => {
        if (this.visualEffects) this.visualEffects.startNavigationAnimation();
      });
    });
  }

  public resetCameraState(coords: [number, number], heading: number) {
    if (this.cameraController) {
      this.cameraController.update(coords, heading, 0);
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
    this.stopRotation();
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

    // Update Visual Effects Guidance system if destination is set
    if (this.visualEffects && this.visualEffects.getDestination()) {
      this.visualEffects.updateGuidanceSystem(coords, this.visualEffects.getDestination()!);
    }
  }

}
