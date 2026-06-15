import React from 'react';
import 'leaflet/dist/leaflet.css';
declare const MapOverlay: ({ show, highContrast }: {
    show: boolean;
    highContrast: boolean;
}) => React.JSX.Element;
export default MapOverlay;
