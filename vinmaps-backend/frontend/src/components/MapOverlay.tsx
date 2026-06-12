import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTraffic } from '../hooks/useTraffic';

// Helper to map trafficLevel to color and radius
const levelToStyle = (level: string, highContrast: boolean) => {
  if (highContrast) {
    // High‑contrast palette (bright, easy to differentiate)
    switch (level) {
      case 'CONGESTION':
        return { color: '#000000', fillColor: '#FFFF00', radius: 35, fillOpacity: 0.9 };
      case 'HIGH':
        return { color: '#000000', fillColor: '#FFAA00', radius: 30, fillOpacity: 0.85 };
      case 'AVERAGE':
        return { color: '#000000', fillColor: '#FFDD00', radius: 25, fillOpacity: 0.8 };
      case 'LOW':
      default:
        return { color: '#000000', fillColor: '#AAFF00', radius: 20, fillOpacity: 0.75 };
    }
  }
  // Normal palette (same as before)
  switch (level) {
    case 'CONGESTION':
      return { color: '#ff3b30', radius: 30, fillOpacity: 0.6 };
    case 'HIGH':
      return { color: '#ff9500', radius: 20, fillOpacity: 0.5 };
    case 'AVERAGE':
      return { color: '#ffcc00', radius: 15, fillOpacity: 0.4 };
    case 'LOW':
    default:
      return { color: '#34c759', radius: 10, fillOpacity: 0.3 };
  }
};

export default MapOverlay;
  const mapRef = useRef<HTMLDivElement>(null);
  const { clusters } = useTraffic();
  const leafletMapRef = useRef<L.Map | null>(null);

  // Initialize map with premium vector/raster tiles and Canvas rendering
  useEffect(() => {
    if (!mapRef.current) return;
    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [0, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });
      const tileUrl = import.meta.env.VITE_TILE_URL || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        detectRetina: true,
        reuseTiles: true,
      }).addTo(map);
      leafletMapRef.current = map;
    }
  }, []);

  // Update overlay circles when data changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    // Clear previous circles (only those in trafficOverlay pane)
    map.eachLayer((layer) => {
      if ((layer as any).options && (layer as any).options.pane === 'trafficOverlay') {
        map.removeLayer(layer);
      }
    });

    const trafficPane = map.createPane('trafficOverlay');
    trafficPane.style.zIndex = '650';

    if (show) {
      clusters.forEach((c) => {
        const style = levelToStyle(c.trafficLevel, highContrast);
        const circle = L.circle([c.center.lat, c.center.lng], {
          color: style.color,
          fillColor: style.fillColor || style.color,
          radius: style.radius * 100, // metres for visibility
          fillOpacity: style.fillOpacity,
          pane: 'trafficOverlay',
          // ARIA‑friendly title for screen readers
          title: `Traffic ${c.trafficLevel}, ${c.vehicleCount} vehicles, avg ${c.averageSpeed.toFixed(1)} km/h`,
        });
        circle.bindTooltip(
          `<b>Level:</b> ${c.trafficLevel}<br/><b>Vehicles:</b> ${c.vehicleCount}<br/><b>Avg Speed:</b> ${c.averageSpeed.toFixed(1)} km/h`,
          { direction: 'top' },
        );
        circle.addTo(map);
      });
    }
  }, [clusters, show, highContrast]);

  return <div ref={mapRef} style={{ height: '100vh', width: '100%' }} aria-label="Live traffic map" role="region" />;
};
