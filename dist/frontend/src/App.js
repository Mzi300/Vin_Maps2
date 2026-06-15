import React, { useEffect, useState } from 'react';
import { useTrafficAlerts } from './hooks/useTrafficAlerts';
import MapOverlay from './components/MapOverlay';
import { MapBranding } from './components/MapBranding';
import { TrafficLegend } from './components/TrafficLegend';
import { TrafficAlertToast } from './components/TrafficAlertToast';
function App() {
    const [showOverlay, setShowOverlay] = useState(true);
    const [highContrast, setHighContrast] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const { alerts } = useTrafficAlerts();
    const toggleContrast = () => setHighContrast(!highContrast);
    const toggleDarkMode = () => setDarkMode(!darkMode);
    useEffect(() => {
        document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    }, [darkMode]);
    return (<>
      <section id="center" className="glass">
        <div className="hero">
          
        </div>
        <div>
          <h1>Real‑time Traffic Overlay</h1>
          <p>Toggle the traffic heat‑map overlay on the map below.</p>
        </div>
        <button type="button" className="counter btn transition" onClick={() => setShowOverlay(!showOverlay)}>
          {showOverlay ? 'Hide' : 'Show'} Overlay
        </button>
        <button type="button" className="counter btn transition" onClick={toggleContrast} aria-pressed={highContrast} aria-label="Toggle high‑contrast mode">
          {highContrast ? 'Normal Contrast' : 'High Contrast'}
        </button>
        <button type="button" className="counter btn transition" onClick={toggleDarkMode} aria-pressed={darkMode} aria-label="Toggle dark mode">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </section>

      
      <div role="region" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px' }}/>

      <MapOverlay show={showOverlay} highContrast={highContrast}/>
      <MapBranding />
      <TrafficLegend />
      <TrafficAlertToast alerts={alerts}/>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>

          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>);
}
export default App;
//# sourceMappingURL=App.js.map