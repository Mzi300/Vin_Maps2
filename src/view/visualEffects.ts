import mapboxgl from 'mapbox-gl';
import type { Map, GeoJSONSource } from 'mapbox-gl';
import '../style/effects.css';
import { ThreeVehicleLayer } from './threeVehicleLayer';

export class VisualEffects {
  private map: Map;
  private animationId: number | null = null;
  private trafficPointCoords: [number, number] = [0, 0];
  private routeCoords: [number, number][] = [];
  private transportEmoji: string = '🚗';
  private vehicleMarker: mapboxgl.Marker | null = null;
  private currentSegmentIndex: number = 0;
  private segmentProgress: number = 0;
  private isWeatherActive: boolean = false;
  private threeVehicleLayer!: ThreeVehicleLayer;
  private userLocationMarker: mapboxgl.Marker | null = null;
  private destMarker: mapboxgl.Marker | null = null;
  private destination: [number, number] | null = null;
  private arrowOffset: number = 0;
  public isFollowing: boolean = true;

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
        if (this.map.getLayer('neon-route-arrows')) this.map.moveLayer('neon-route-arrows');
      } catch (e) {}
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
          'line-color': '#4285F4', // Google Maps Blue
          'line-width': 14,
          'line-opacity': 1,
          'line-blur': 0
        },
        slot: 'top'
      });
      
      try {
        this.map.moveLayer('neon-route-core');
      } catch (e) {}


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
          'line-color': '#ffffff', // Thin white border/glow
          'line-width': 16,
          'line-blur': 1,
          'line-opacity': 0.3
        },
        slot: 'top'
      }, 'neon-route-core');

      // 3. Directional Arrows (Moving Pattern)
      this.map.addLayer({
        id: 'neon-route-arrows',
        type: 'line',
        source: 'neon-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 4,
          'line-dasharray': [2, 4],
          'line-opacity': 0.8
        },
        slot: 'top'
      });

      this.animateArrows();

      // 4. X-Ray Symbol Route (Always on top of buildings)
      this.map.addLayer({
        id: 'neon-route-symbols',
        type: 'symbol',
        source: 'neon-route-source',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 20,
          'icon-image': 'circle-15',
          'icon-size': 0.8,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-rotation-alignment': 'map'
        },
        paint: {
          'icon-color': '#ffffff', // White chevrons
          'icon-halo-color': '#4285F4',
          'icon-halo-width': 1,
          'icon-opacity': 0.8
        },
        slot: 'top'
      });

      this.animateArrows();
    }

    this.destination = destination;
    this.addDestinationMarker(destination);
    this.setVehicleAtStart();
  }

  public getDestination(): [number, number] | null {
    return this.destination;
  }

  /**
   * 3. Navigation Simulation Control
   * Places the vehicle at the start but does not move yet.
   */
  public setVehicleAtStart() {
    if (this.routeCoords.length < 2) return;
    
    this.currentSegmentIndex = 0;
    this.segmentProgress = 0;
    this.trafficPointCoords = [...this.routeCoords[0]] as [number, number];

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
      this.threeVehicleLayer.updatePosition(this.trafficPointCoords, bearing);
    }
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.isFollowing = true;
    this.setupManualControlListeners();
  }

  private setupManualControlListeners() {
    const unlock = () => {
      if (this.isFollowing) {
        this.isFollowing = false;
        // Notify UI to show "Re-center" button
        window.dispatchEvent(new CustomEvent('nav-camera-unlocked'));
      }
    };

    this.map.on('dragstart', unlock);
    this.map.on('wheel', unlock);
    this.map.on('pitchstart', unlock);
    this.map.on('rotatestart', unlock);
    this.map.on('touchstart', unlock);
  }

  public recenter() {
    this.isFollowing = true;
    window.dispatchEvent(new CustomEvent('nav-camera-locked'));
  }

  public startNavigationAnimation() {
    if (this.animationId) return;
    this.animateTraffic();
  }

  public updateUserVehicle(coords: [number, number], heading: number) {
    this.trafficPointCoords = coords;
    
    // Update Emoji Marker
    if (!this.vehicleMarker) {
      const el = document.createElement('div');
      el.className = 'vehicle-emoji-marker';
      el.style.fontSize = '38px';
      el.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))';
      el.innerText = this.transportEmoji;
      
      this.vehicleMarker = new mapboxgl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
      .setLngLat(coords)
      .addTo(this.map);
    } else {
      this.vehicleMarker.setLngLat(coords);
      this.vehicleMarker.setRotation(heading);
      this.vehicleMarker.getElement().innerText = this.transportEmoji;
    }
    
    // Disable 3D layer if it exists to avoid overlap
    try {
      if (this.map.getLayer('3d-vehicle-layer')) {
        this.map.setLayoutProperty('3d-vehicle-layer', 'visibility', 'none');
      }
    } catch(e) {}

    this.updateUserLocationGlow(coords);
  }

  public setTransportMode(emoji: string) {
    this.transportEmoji = emoji;
    if (this.vehicleMarker) {
      this.vehicleMarker.getElement().innerText = emoji;
    }
  }

  public updateUserLocationGlow(coords: [number, number]) {
    if (!this.userLocationMarker) {
      const el = document.createElement('div');
      el.className = 'user-location-glow';
      this.userLocationMarker = new mapboxgl.Marker({
        element: el,
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat(coords)
        .addTo(this.map);
    } else {
      this.userLocationMarker.setLngLat(coords);
    }
  }

  public dimMapLayers(dim: boolean) {
    const opacity = dim ? 0.3 : 1.0;
    const layers = ['basemap', 'poi-label', 'transit-label'];
    
    layers.forEach(l => {
      try {
        if (this.map.getLayer(l)) {
          this.map.setPaintProperty(l, 'icon-opacity', opacity);
          this.map.setPaintProperty(l, 'text-opacity', opacity);
        }
      } catch (e) {}
    });

    // Dim the 3D buildings as well if using standard
    try {
      this.map.setConfigProperty('basemap', 'lightPreset', dim ? 'night' : 'dusk');
      // Set building opacity to 0.4 for X-ray effect
      this.map.setPaintProperty('building', 'fill-extrusion-opacity', dim ? 0.4 : 1.0);
    } catch (e) {}
  }

  private addDestinationMarker(coords: [number, number]) {
    const el = document.createElement('div');
    el.className = 'dest-beacon-container';
    el.innerHTML = `
      <div class="dest-beacon-beam"></div>
      <div class="dest-beacon-flare"></div>
      <div class="dest-label" style="position: absolute; bottom: 20px; white-space: nowrap; font-family: monospace; color: #00f2ff; text-shadow: 0 0 10px #00f2ff;">OBJECTIVE REACHED</div>
    `;
    
    if (this.destMarker) this.destMarker.remove();
    this.destMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
      pitchAlignment: 'map',
      rotationAlignment: 'map'
    })
      .setLngLat(coords)
      .addTo(this.map);
  }

  /**
   * 4. Guidance System
   * Updates a directional beam/arrow from vehicle to destination
   */
  public updateGuidanceSystem(vehiclePos: [number, number], destPos: [number, number]) {
    // 1. Update guidance beam source
    const beamGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [vehiclePos, destPos]
          }
        }
      ]
    };

    if (this.map.getSource('guidance-beam-source')) {
      (this.map.getSource('guidance-beam-source') as GeoJSONSource).setData(beamGeoJSON);
    } else {
      this.map.addSource('guidance-beam-source', {
        type: 'geojson',
        data: beamGeoJSON
      });

      this.map.addLayer({
        id: 'guidance-beam',
        type: 'line',
        source: 'guidance-beam-source',
        paint: {
          'line-color': '#00f2ff',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.4
        }
      });

      // Add a pulsing arrow/triangle pointing towards the destination
      this.map.addLayer({
        id: 'guidance-arrow',
        type: 'symbol',
        source: 'guidance-beam-source',
        layout: {
          'icon-image': 'triangle-15',
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-placement': 'point'
        },
        paint: {
          'icon-color': '#00f2ff',
          'icon-halo-color': '#000',
          'icon-halo-width': 1
        }
      });
    }

    // Update arrow bearing
    const bearing = this.calculateBearing(vehiclePos, destPos);
    const arrowGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { bearing: bearing },
          geometry: {
            type: 'Point',
            coordinates: vehiclePos // Place arrow at vehicle position
          }
        }
      ]
    };
    
    // We need a separate source for the arrow if we want it to stay at the vehicle
    if (this.map.getSource('guidance-arrow-source')) {
      (this.map.getSource('guidance-arrow-source') as GeoJSONSource).setData(arrowGeoJSON);
    } else {
      this.map.addSource('guidance-arrow-source', {
        type: 'geojson',
        data: arrowGeoJSON
      });

      this.map.addLayer({
        id: 'guidance-arrow-layer',
        type: 'symbol',
        source: 'guidance-arrow-source',
        layout: {
          'icon-image': 'triangle-11', // Standard Mapbox icon
          'icon-size': 1.5,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true
        },
        paint: {
          'icon-color': '#00f2ff',
          'icon-halo-color': '#000',
          'icon-halo-width': 2,
          'icon-opacity': 0.8
        }
      });
    }

    // 2. Distance-based scaling for destination marker
    if (this.destMarker) {
      const dist = this.calculateDistance(vehiclePos, destPos);
      const el = this.destMarker.getElement();
      
      // Scaling: larger when far, smaller/precise when near
      const scale = Math.min(2.0, Math.max(0.8, dist / 1000));
      el.style.transform = `scale(${scale})`;
      
      // Opacity: pulse faster if close? (Optional)
    }
  }

  private calculateDistance(p1: [number, number], p2: [number, number]): number {
    const R = 6371e3; // meters
    const φ1 = p1[1] * Math.PI / 180;
    const φ2 = p2[1] * Math.PI / 180;
    const Δφ = (p2[1] - p1[1]) * Math.PI / 180;
    const Δλ = (p2[0] - p1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateBearing(start: [number, number], end: [number, number]): number {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return (Math.atan2(dx, dy) * 180) / Math.PI;
  }

  public clearRoute() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.destMarker) this.destMarker.remove();
    if (this.map.getLayer('neon-route-core')) this.map.removeLayer('neon-route-core');
    if (this.map.getLayer('neon-route-glow')) this.map.removeLayer('neon-route-glow');
    if (this.map.getSource('neon-route-source')) this.map.removeSource('neon-route-source');
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

      // Only follow if the user hasn't manually moved the map
      if (this.isFollowing) {
        this.map.setCenter(this.trafficPointCoords);
        this.map.setBearing(bearing);
        this.map.setPitch(75);
        // Do NOT set zoom here to allow users to adjust zoom level while following
        // Or we can set a default zoom but allow the user to change it.
        // Google Maps usually keeps the zoom level you set.
        if (this.map.getZoom() < 16) this.map.setZoom(18); 
      }

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
