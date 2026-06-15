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
  private onStyleReadyCallback?: () => void;

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

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 1. WebGL Support Fallback Guard
    if (!mapboxgl.supported()) {
      console.error('[MapRenderer] WebGL not supported on this device/browser');
      const container = document.getElementById(this.containerId);
      if (container) {
        container.innerHTML = `
          <div style="padding: 20px; color: white; background: #0b0c10; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-family: sans-serif; border: 1px solid #1f2833; box-sizing: border-box;">
            <span style="font-size: 3rem; margin-bottom: 15px;">⚠️</span>
            <h3 style="margin: 0 0 10px 0; color: #00f2ff; text-shadow: 0 0 10px rgba(0,242,255,0.5);">WebGL ACCELERATION REQUIRED</h3>
            <p style="margin: 0 0 20px 0; font-size: 0.9rem; max-width: 300px; opacity: 0.8; line-height: 1.4;">
              VinMaps requires WebGL hardware acceleration to load high-fidelity road layouts and telemetry.
            </p>
            <p style="font-size: 0.8rem; opacity: 0.6; max-width: 280px; line-height: 1.4;">
              Please enable "Hardware Acceleration" in your browser settings or update your Android System WebView.
            </p>
          </div>
        `;
      }
      setTimeout(() => {
        this.resolveStyleLoaded();
        if (this.onStyleReadyCallback) this.onStyleReadyCallback();
      }, 500);
      return;
    }

    try {
      // 2. Initialise Mapbox Map (Adaptive options for mobile compatibility)
      this.map = new mapboxgl.Map({
        container: this.containerId,
        style: 'mapbox://styles/mapbox/standard',
        center: this.initialCenter,
        zoom: isMobile ? 16.5 : 18.2, // Slightly zoomed out on mobile for better initial performance
        pitch: isMobile ? 55 : 72,     // Lower pitch on mobile to reduce render load
        bearing: 0,
        antialias: !isMobile,          // Disable antialias on mobile for massive rendering speedup
        interactive: true,
        failIfMajorPerformanceCaveat: false, // Ensure loading on low-end GPUs
        maxBounds: [
          [16.3449, -34.8191],
          [32.8912, -22.1265]
        ]
      });

      this.map.on('style.load', () => {
        this.visualEffects = new VisualEffects(this.map);
        (this.map as any).visualEffects = this.visualEffects;
        this.cameraController = new NavigationCameraController(this.map);

        // Add Mapbox scale control for tactical navigation scale
        const scale = new mapboxgl.ScaleControl({
          maxWidth: 80,
          unit: 'metric'
        });
        this.map.addControl(scale, 'bottom-left');

        // 3. Cinematic lighting preset
        let lightPreset = 'dusk';
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 17) {
          lightPreset = 'day';
        } else if (hour >= 17 && hour < 19) {
          lightPreset = 'dusk';
        } else if (hour >= 19 || hour < 5) {
          lightPreset = 'night';
        } else {
          lightPreset = 'dawn';
        }
        this.map.setConfigProperty('basemap', 'lightPreset', lightPreset);
        
        // Disable 3D buildings and custom models on mobile to maximize performance and prevent WebView out-of-memory crashes
        this.map.setConfigProperty('basemap', 'showLandmarks', !isMobile);
        this.map.setConfigProperty('basemap', 'show3dObjects', !isMobile);
        this.map.setConfigProperty('basemap', 'showTraffic', true); // Keep live traffic flow

        // 4. Tactical road overlay (Optimized layer styling)
        this.injectTacticalRoads();

        // 5. Atmosphere / Fog (Skip on mobile to avoid costly fragment shaders)
        if (!isMobile) {
          this.map.setFog({
            range: [0.5, 4],
            color: '#050505',
            'high-color': '#00f2ff',
            'space-color': '#000000',
            'horizon-blend': 0.05
          });
        }

        // 6. Stylised label appearance (Optimized)
        this.stylizeLabels();

        // 7. Smooth Zoom Tuning
        this.map.scrollZoom.setWheelZoomRate(1/600); 
        this.map.scrollZoom.setZoomRate(1/600);

        // Resolve internal ready promise
        this.resolveStyleLoaded();
        if (this.onStyleReadyCallback) this.onStyleReadyCallback();
      });

      this.map.on('load', () => {
        // 8. Interactive POIs & Landmarks (Safe Query)
        this.map.on('click', (e) => {
          try {
            const features = this.map.queryRenderedFeatures(e.point);
            if (!features || features.length === 0) return;
            
            const interactive = features.find(f => 
              f.properties?.name || 
              f.properties?.name_en ||
              f.layer?.id.includes('label') ||
              f.layer?.id.includes('poi')
            );
            
            if (!interactive) return;
            
            const props = interactive.properties as any;
            const name = props.name || props.name_en || 'Target Objective';
            const category = props.category_en || props.type || 'Urban Node';
            
            this.emitPoiIntelligence(name, category, interactive.geometry);
          } catch (err) {}
        });

        this.map.on('mousemove', (e) => {
          try {
            const features = this.map.queryRenderedFeatures(e.point);
            const hasInteractive = features && features.some(f => 
              f.layer?.id.includes('poi') || 
              f.layer?.id.includes('label') || 
              f.layer?.id.includes('place')
            );
            this.map.getCanvas().style.cursor = hasInteractive ? 'pointer' : '';
          } catch (err) {}
        });
      });
    } catch (e) {
      console.error('[MapRenderer] Initialization failed:', e);
      // Fail gracefully so the app can hide loader and show error
      setTimeout(() => {
        this.resolveStyleLoaded();
        if (this.onStyleReadyCallback) this.onStyleReadyCallback();
      }, 500);
    }

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
  public setPoiFilter(category: string | null) {
    if (this.visualEffects) {
      this.visualEffects.setPoiFilter(category);
    }
  }

  /** --------------------------------------------------------------
   *  Tactical road styling
   *  -------------------------------------------------------------- */
  private injectTacticalRoads() {
    const layers = this.map.getStyle().layers;
    // Batch updates only to targeted layer classes
    layers.forEach(layer => {
      try {
        const id = layer.id;
        if (id.includes('road')) {
          this.map.setPaintProperty(id, 'line-color', '#050505');
        } else if (id.includes('water')) {
          this.map.setPaintProperty(id, 'fill-color', '#0000ff');
        } else if ((id.includes('land') || id.includes('park') || id.includes('green')) && id.includes('area')) {
          this.map.setPaintProperty(
            id,
            'fill-color',
            id.includes('land') ? '#4b3621' : '#00ff00'
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

  private stylizeLabels() {
    const layers = this.map.getStyle().layers;
    // Only target layers containing 'label' in their ID to speed up styling execution
    layers.forEach(layer => {
      if (layer.type === 'symbol' && layer.id.includes('label')) {
        try {
          this.map.setPaintProperty(layer.id, 'text-halo-color', 'rgba(0,0,0,0.85)');
          this.map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
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
  /** Register a UI callback that runs when the map style is fully loaded */
  public onStyleReady(cb: () => void) {
    this.onStyleReadyCallback = cb;
  }

  // Preserve backward compatibility for any older code using the old name
  public onStyleLoaded(cb: () => void) { this.onStyleReady(cb); }

public enterCinematicMode() {
    if (this.cameraController) {
      this.cameraController.setMode(CameraMode.CINEMATIC);
    }
  }

  public enterNavigationMode() {
    if (this.cameraController) {
      this.cameraController.setMode(CameraMode.NAVIGATION);
    }
  }

  public exitNavigationMode() {
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
    force: boolean = false,
    _minZoom: number = 15.5,
    _maxZoom: number = 19
  ) {
    if (this.cameraController) {
      this.cameraController.update(coords, heading, speed, force);
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
