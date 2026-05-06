import mapboxgl from 'mapbox-gl';
import type { Map, GeoJSONSource } from 'mapbox-gl';
import '../style/effects.css';
import { ThreeVehicleLayer } from './threeVehicleLayer';

export class VisualEffects {
  private map: Map;
  private animationId: number | null = null;
  private trafficPointCoords: [number, number] = [0, 0];
  private routeCoords: [number, number][] = [];
  private currentSegmentIndex: number = 0;
  private segmentProgress: number = 0;
  private isWeatherActive: boolean = false;
  private threeVehicleLayer!: ThreeVehicleLayer;
  private destMarker: mapboxgl.Marker | null = null;

  constructor(map: any) {
    this.map = map;
  }

  /**
   * (Removed manual 3D Buildings logic as user requested return to Mapbox Standard style)
   */

  /**
   * 2. Navigation Route Upgrade
   * Adds a glowing neon route line between origin and destination
   */
  public drawGlowingRoute(origin: [number, number], destination: [number, number], routeCoords?: [number, number][]) {
    // Use real optimized coordinates if provided, otherwise fallback to mock
    if (routeCoords && routeCoords.length > 0) {
      this.routeCoords = routeCoords;
    } else {
      // Fallback/Mock logic
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

    if (this.map.getSource('neon-route-source')) {
      (this.map.getSource('neon-route-source') as GeoJSONSource).setData(routeGeoJSON);
    } else {
      this.map.addSource('neon-route-source', {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Core bright line
      this.map.addLayer({
        id: 'neon-route-core',
        type: 'line',
        source: 'neon-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00f2ff',
          'line-width': 4,
          'line-opacity': 1
        }
      });

      // Outer glow layer
      this.map.addLayer({
        id: 'neon-route-glow',
        type: 'line',
        source: 'neon-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00f2ff',
          'line-width': 12,
          'line-blur': 10,
          'line-opacity': 0.4
        }
      });
    }

    this.addDestinationMarker(destination);
    this.startTrafficSimulation();
  }

  private addDestinationMarker(coords: [number, number]) {
    const el = document.createElement('div');
    el.className = 'dest-marker';
    el.innerHTML = '<div class="pin"></div><div class="pulse"></div>';
    
    if (this.destMarker) this.destMarker.remove();
    this.destMarker = new mapboxgl.Marker(el)
      .setLngLat(coords)
      .addTo(this.map);
  }

  public clearRoute() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.destMarker) this.destMarker.remove();
    if (this.map.getLayer('neon-route-core')) this.map.removeLayer('neon-route-core');
    if (this.map.getLayer('neon-route-glow')) this.map.removeLayer('neon-route-glow');
    if (this.map.getSource('neon-route-source')) this.map.removeSource('neon-route-source');
  }

  /**
   * 3. Light Traffic Simulation
   * Moves a point along the drawn route
   */
  private startTrafficSimulation() {
    if (this.routeCoords.length < 2) return;
    
    this.currentSegmentIndex = 0;
    this.segmentProgress = 0;
    this.trafficPointCoords = [...this.routeCoords[0]] as [number, number];

    if (!this.map.getLayer('3d-vehicle-layer')) {
      this.threeVehicleLayer = new ThreeVehicleLayer(this.map);
      this.map.addLayer(this.threeVehicleLayer as any);
    }

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animateTraffic();
  }

  private animateTraffic = () => {
    try {
      if (!this.map || !this.routeCoords || this.routeCoords.length < 2) return;

      if (this.currentSegmentIndex >= this.routeCoords.length - 1) {
        this.currentSegmentIndex = 0;
        this.segmentProgress = 0;
      }

      const startNode = this.routeCoords[this.currentSegmentIndex];
      const endNode = this.routeCoords[this.currentSegmentIndex + 1];

      if (!startNode || !endNode) return;

      this.segmentProgress += 0.005;

      if (this.segmentProgress >= 1) {
        this.segmentProgress = 0;
        this.currentSegmentIndex++;
        if (this.currentSegmentIndex >= this.routeCoords.length - 1) {
          this.currentSegmentIndex = 0;
        }
      } else {
        this.trafficPointCoords[0] = startNode[0] + (endNode[0] - startNode[0]) * this.segmentProgress;
        this.trafficPointCoords[1] = startNode[1] + (endNode[1] - startNode[1]) * this.segmentProgress;
      }

      const dx = endNode[0] - startNode[0];
      const dy = endNode[1] - startNode[1];
      const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;

      if (this.threeVehicleLayer) {
        this.threeVehicleLayer.updatePosition(this.trafficPointCoords, bearing);
      }

      this.map.setCenter(this.trafficPointCoords);
      this.map.setBearing(bearing);
      this.map.setPitch(75);
      this.map.setZoom(18);

      this.animationId = requestAnimationFrame(this.animateTraffic);
    } catch (err) {
      console.warn('[VisualEffects] Animation loop error:', err);
      if (this.animationId) cancelAnimationFrame(this.animationId);
    }
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
}
