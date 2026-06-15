import { useEffect, useState } from 'react';
import { useTrafficAlerts } from './hooks/useTrafficAlerts';
import MapOverlay from './components/MapOverlay';
import { MapBranding } from './components/MapBranding';
import { TrafficLegend } from './components/TrafficLegend';
import { TrafficAlertToast } from './components/TrafficAlertToast';

function App() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const { alerts } = useTrafficAlerts();

  const toggleContrast = () => setHighContrast(!highContrast);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Apply dark or light theme to the root element
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <>
      {/* Tactical Glassmorphism Control Panel */}
      <div className="control-dashboard glass-panel fade-in">
        <div>
          <h1 className="tactical-title">
            <span className="status-indicator" style={{ marginRight: '10px' }}></span>
            VinMaps
          </h1>
          <p style={{ margin: '0 0 16px 0', opacity: 0.8, fontSize: '0.9rem' }}>
            Tactical Intelligence Navigation
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="tactical-btn"
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? '👁️ HIDE TRAFFIC' : '👁️ SHOW TRAFFIC'}
          </button>
          
          <div className="toggle-group">
            <button
              type="button"
              className="tactical-btn"
              onClick={toggleContrast}
              aria-pressed={highContrast}
            >
              {highContrast ? '🔴 NORMAL' : '🔆 HIGH CONTRAST'}
            </button>
            <button
              type="button"
              className="tactical-btn"
              onClick={toggleDarkMode}
              aria-pressed={darkMode}
            >
              {darkMode ? '☀️ LIGHT' : '🌙 DARK'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden live region for screen-reader announcements */}
      <div
        role="region"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px' }}
      />

      <div className="map-container">
        <MapOverlay show={showOverlay} highContrast={highContrast} />
      </div>

      <MapBranding />
      <TrafficLegend />
      <TrafficAlertToast alerts={alerts} />
    </>
  );
}

export default App;
