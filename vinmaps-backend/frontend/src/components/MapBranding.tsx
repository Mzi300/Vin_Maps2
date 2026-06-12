import React from 'react';
import brandingLogo from '../assets/hero.png'; // using existing hero image as brand logo

export const MapBranding: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.8)',
      padding: '4px 8px',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      fontFamily: 'var(--sans)',
    }}>
      <img src={brandingLogo} alt="VinMaps" style={{ width: 24, height: 24, marginRight: 6 }} />
      <span style={{ fontWeight: 600, color: '#111' }}>VinMaps</span>
    </div>
  );
};
