import mapboxgl from 'mapbox-gl';
import type { Map, GeoJSONSource } from 'mapbox-gl';
import '../style/effects.css';
import { ThreeVehicleLayer } from './threeVehicleLayer';

export class VisualEffects {
  private map: Map;
  private animationId: number | null = null;
  private routeCoords: [number, number][] = [];
  private vehicleMarker: mapboxgl.Marker | null = null;
  private isWeatherActive: boolean = false;
  private threeVehicleLayer!: ThreeVehicleLayer;
  private userLocationMarker: mapboxgl.Marker | null = null;
  private destMarker: mapboxgl.Marker | null = null;
  private arrowOffset: number = 0;
  private lastStableCoords: [number, number] = [0, 0];

  constructor(map: any) {
    this.map = map;
    
    // Initialize 3D Vehicle Layer
    this.threeVehicleLayer = new ThreeVehicleLayer(this.map);
    this.map.addLayer(this.threeVehicleLayer);
    
    // Ensure lastStableCoords is initialized so gating works on first move
    this.lastStableCoords = [0, 0];
  }

  /**
   * 2. Navigation Route Upgrade
   * Adds a glowing neon route line between origin and destination
   */
  public drawGlowingRoute(origin: [number, number], destination: [number, number], routeCoords?: [number, number][]) {
    // Use real optimized coordinates if provided, otherwise fallback to mock
    if (routeCoords && routeCoords.length > 0) {
      this.routeCoords = routeCoords;
    } else {
      this.routeCoords = [
        origin,
        [origin[0] + (destination[0] - origin[0]) * 0.25, origin[1] + (destination[1] - origin[1]) * 0.2],
        [origin[0] + (destination[0] - origin[0]) * 0.5, origin[1] + (destination[1] - origin[1]) * 0.6],
        [origin[0] + (destination[0] - origin[0]) * 0.75, origin[1] + (destination[1] - origin[1]) * 0.8],
        destination
      ];
    }

    const routeGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: this.routeCoords
          }
        }
      ]
    };

    console.log(`[VisualEffects] Updating route: ${this.routeCoords.length} points.`);

    if (this.map.getSource('neon-route-source')) {
      (this.map.getSource('neon-route-source') as GeoJSONSource).setData(routeGeoJSON);
      
      // Force move to top on update
      try {
        if (this.map.getLayer('neon-route-glow')) this.map.moveLayer('neon-route-glow');
        if (this.map.getLayer('neon-route-core')) this.map.moveLayer('neon-route-core');
      } catch (e) {}
    } else {
      this.map.addSource('neon-route-source', {
        type: 'geojson',
        data: routeGeoJSON
      });

      // 1. Outer glow layer (Tactical Neon Flare) - Dynamic zoom matching road width
      this.map.addLayer({
        id: 'neon-route-glow',
        type: 'line',
        source: 'neon-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#32CD32', // Lime Glow
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            10, 16,
            13, 32,
            15, 50,
            17, 80,
            20, 140
          ],
          'line-blur': 12,         // Bloom effect
          'line-opacity': 0.45      // High visibility glow
        },
        slot: 'middle' // Draws flat on the ground/road, below 3D buildings
      });

      // 2. Core bright line - Bold green line scaling to perfectly fill the road
      this.map.addLayer({
        id: 'neon-route-core',
        type: 'line',
        source: 'neon-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#32CD32', // Ultra-bright Lime
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            10, 8,
            13, 16,
            15, 24,
            17, 36,
            20, 70
          ],
          'line-opacity': 1.0,
          'line-blur': 0
        },
        slot: 'middle' // Draws flat on the ground/road, below 3D buildings
      }, 'neon-route-glow');

      try {
        this.map.moveLayer('neon-route-glow');
        this.map.moveLayer('neon-route-core');
      } catch (e) {}
    }

    // Start arrow dash flow animation loop if not already running
    if (this.animationId === null) {
      this.animateArrows();
    }

    // Add Destination Marker (Neon Pulse)
    this.addDestinationMarker(destination);
  }

  private addDestinationMarker(coords: [number, number]) {
    if (this.destMarker) this.destMarker.remove();

    const el = document.createElement('div');
    el.className = 'tactical-destination-marker';
    el.innerHTML = `
      <div class="dest-outer-ring"></div>
      <div class="dest-inner-circle">
        <div class="dest-arrow"></div>
      </div>
    `;

    this.destMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(coords)
      .addTo(this.map);

    // Hide initially if navigating
    if (this.isNavigating) {
      el.style.visibility = 'hidden';
    }
  }

  private isNavigating: boolean = false;
  public setNavigating(active: boolean) {
    this.isNavigating = active;
    if (this.destMarker) {
      this.destMarker.getElement().style.visibility = active ? 'hidden' : 'visible';
    }
  }

  public updateDestMarkerVisibility(distanceRemaining: number) {
    if (this.destMarker) {
      // Show marker when within 50 meters of destination
      this.destMarker.getElement().style.visibility = (distanceRemaining < 50) ? 'visible' : 'hidden';
    }
  }

  /**
   * 3. Navigation Simulation Control
   * Places the vehicle at the start but does not move yet.
   */
  public setVehicleAtStart() {
    if (this.routeCoords.length < 2) return;
    
    const startCoords = [...this.routeCoords[0]] as [number, number];

    if (!this.map.getLayer('3d-vehicle-layer')) {
      this.threeVehicleLayer = new ThreeVehicleLayer(this.map);
      this.map.addLayer(this.threeVehicleLayer as any);
    } else {
      // Re-add layer to ensure it's on top if style changed
      const layerId = '3d-vehicle-layer';
      if (this.map.getLayer(layerId)) {
        this.map.moveLayer(layerId); // Move to top of stack
      }
    }

    // Calculate initial bearing
    const startNode = this.routeCoords[0];
    const endNode = this.routeCoords[1];
    const dx = endNode[0] - startNode[0];
    const dy = endNode[1] - startNode[1];
    const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;

    if (this.threeVehicleLayer) {
      this.threeVehicleLayer.updatePosition(startCoords, bearing);
    }
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

  }

  public recenter() {
    // Logic moved to NavigationCameraController via MapRenderer
  }

  public updateUserVehicle(coords: [number, number], heading: number) {
    if (!this.map) return;

    // 1. Handle 2D Marker (Hide it for premium 3D look)
    if (this.vehicleMarker) {
      this.vehicleMarker.getElement().style.display = 'none';
    }

    // 2. Handle 3D Vehicle Layer
    if (this.threeVehicleLayer) {
      try {
        if (this.map.getLayer('3d-vehicle-layer')) {
          // First update should always show the vehicle and force position
          if (this.lastStableCoords[0] === 0) {
            console.log("[VisualEffects] Force-revealing vehicle at start:", coords);
            this.threeVehicleLayer.updatePosition(coords, heading);
            this.lastStableCoords = [...coords];
            this.map.triggerRepaint();
            return;
          }

          // Less strict motion gating: only update if moved > 0.5m
          const dist = this.calculateDistance(this.lastStableCoords, coords);
          if (dist > 0.5) { 
            this.map.setLayoutProperty('3d-vehicle-layer', 'visibility', 'visible');
            this.threeVehicleLayer.updatePosition(coords, heading);
            this.lastStableCoords = [...coords];
            
            // Periodically force to top to prevent building occlusion
            this.map.moveLayer('3d-vehicle-layer');
          }
        }
      } catch (e) {
        console.warn("[VisualEffects] 3D Vehicle sync error:", e);
      }
    }

    this.updateUserLocationGlow(coords);
  }

  private calculateDistance(p1: [number, number], p2: [number, number]): number {
    const R = 6371e3; // metres
    const φ1 = p1[1] * Math.PI/180;
    const φ2 = p2[1] * Math.PI/180;
    const Δφ = (p2[1]-p1[1]) * Math.PI/180;
    const Δλ = (p2[0]-p1[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  public updateUserLocationGlow(coords: [number, number]) {
    if (this.userLocationMarker) {
      this.userLocationMarker.setLngLat(coords);
      return;
    }

    const el = document.createElement('div');
    el.className = 'user-location-glow';
    el.innerHTML = '<div class="glow-core"></div><div class="glow-pulse"></div>';

    this.userLocationMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(coords)
      .addTo(this.map);
  }

  public clearRoute() {
    if (this.map.getLayer('neon-route-glow')) this.map.removeLayer('neon-route-glow');
    if (this.map.getLayer('neon-route-core')) this.map.removeLayer('neon-route-core');
    if (this.map.getLayer('neon-route-arrows')) this.map.removeLayer('neon-route-arrows');
    if (this.map.getLayer('neon-route-symbols')) this.map.removeLayer('neon-route-symbols');
    if (this.map.getSource('neon-route-source')) this.map.removeSource('neon-route-source');
    if (this.destMarker) this.destMarker.remove();
    this.destMarker = null;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public togglePOILayers(active: boolean) {
    if (!active) {
      this.setPoiFilter(null);
    } else {
      // Default to scanning for hospitals/emergency nodes
      this.setPoiFilter('hospital');
    }
  }

  public setPoiFilter(category: string | null) {
    // 1. Clear any custom markers if switching categories
    // (Custom markers could be added here if we wanted to supplement Mapbox data)

    // 2. Define category keywords for Mapbox Standard layers and properties
    const categoryKeywords: Record<string, string[]> = {
      hospital: ['hospital', 'clinic', 'medical', 'health'],
      police: ['police', 'saps', 'security', 'government', 'justice'],
      bank: ['bank', 'atm', 'finance', 'money'],
      fuel: ['fuel', 'gas', 'petrol', 'garage'],
      rank: ['bus', 'transit', 'taxi', 'station', 'stop'],
      shisanyama: ['restaurant', 'food', 'fast_food', 'bar', 'shisanyama'],
      spaza: ['convenience', 'shop', 'grocery', 'market', 'mall', 'store'],
      hotel: ['hotel', 'motel', 'lodging', 'resort', 'guest_house'],
      school: ['school', 'university', 'college', 'education', 'varsity', 'academy']
    };

    const keywords = category && category !== 'all' ? categoryKeywords[category] || [category] : [];
    
    // 3. Update visibility and style of existing map labels
    const layers = this.map.getStyle().layers;
    layers.forEach(layer => {
      if (layer.type === 'symbol') {
        const layerId = layer.id.toLowerCase();
        // Check if the layer ID itself suggests a match (for some styles)
        const isLayerMatch = keywords.some(kw => layerId.includes(kw));
        
        try {
          // For Mapbox Standard, we can't easily set filters on individual features inside the basemap 
          // via setFilter on the 'basemap' layer. Instead, we use setPaintProperty to highlight them 
          // if they match our tactical criteria.
          
          const highlightColor = '#00f2ff'; // Tactical Cyan
          
          // We apply a conditional paint property if the style supports it, 
          // or we just highlight specific layers.
          if (isLayerMatch || category === 'all') {
            this.map.setPaintProperty(layer.id, 'text-color', highlightColor);
            this.map.setPaintProperty(layer.id, 'text-halo-color', 'rgba(0, 242, 255, 0.4)');
            this.map.setPaintProperty(layer.id, 'text-halo-width', 3);
          } else {
            // Reset to default basemap presets to keep all roadside names legible and visible
            this.map.setPaintProperty(layer.id, 'text-color', undefined);
            this.map.setPaintProperty(layer.id, 'text-halo-color', undefined);
            this.map.setPaintProperty(layer.id, 'text-halo-width', undefined);
          }
        } catch (e) {
          // Ignore errors for layers that don't support these properties
        }
      }
    });
  }

  /**
   * 4. Weather & Atmosphere Integration
   * Toggles a CSS overlay for light rain
   */
  public toggleWeather() {
    this.isWeatherActive = !this.isWeatherActive;
    let overlay = document.getElementById('weather-overlay');
    
    if (this.isWeatherActive) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'weather-overlay';
        overlay.className = 'weather-rain';
        const uiContainer = document.querySelector('.ui-overlay');
        if (uiContainer) {
          // Insert before UI so it's over map but under UI
          uiContainer.parentNode?.insertBefore(overlay, uiContainer);
        }
      } else {
        overlay.style.display = 'block';
      }
    } else {
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  private animateArrows = () => {
    try {
      this.arrowOffset += 0.05;
      if (this.map.getLayer('neon-route-arrows')) {
        // This simulates a moving dashed line
        this.map.setPaintProperty('neon-route-arrows', 'line-dasharray', [1, 2, this.arrowOffset % 4]);
      }
      requestAnimationFrame(this.animateArrows);
    } catch (e) {}
  }
}
