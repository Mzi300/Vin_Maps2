import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTraffic } from '../hooks/useTraffic';
const levelToStyle = (level, highContrast) => {
    if (highContrast) {
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
const MapOverlay = ({ show, highContrast }) => {
    const mapRef = useRef(null);
    const { clusters } = useTraffic();
    const leafletMapRef = useRef(null);
    useEffect(() => {
        if (!mapRef.current)
            return;
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
    useEffect(() => {
        if (!leafletMapRef.current)
            return;
        const map = leafletMapRef.current;
        map.eachLayer((layer) => {
            if (layer.options && layer.options.pane === 'trafficOverlay') {
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
                    radius: style.radius * 100,
                    fillOpacity: style.fillOpacity,
                    pane: 'trafficOverlay',
                    title: `Traffic ${c.trafficLevel}, ${c.vehicleCount} vehicles, avg ${c.averageSpeed.toFixed(1)} km/h`,
                });
                circle.bindTooltip(`<b>Level:</b> ${c.trafficLevel}<br/><b>Vehicles:</b> ${c.vehicleCount}<br/><b>Avg Speed:</b> ${c.averageSpeed.toFixed(1)} km/h`, { direction: 'top' });
                circle.addTo(map);
            });
        }
    }, [clusters, show, highContrast]);
    return <div ref={mapRef} className="glass" tabIndex={0} style={{ height: '100vh', width: '100%' }} aria-label="Live traffic map" role="region"/>;
};
export default MapOverlay;
//# sourceMappingURL=MapOverlay.js.map