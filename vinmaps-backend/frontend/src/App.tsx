import { MapBranding } from './components/MapBranding';

function App() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  const { alerts } = useTrafficAlerts();

  const toggleContrast = () => setHighContrast(!highContrast);

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="VinMaps hero image" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Real‑time Traffic Overlay</h1>
          <p>Toggle the traffic heat‑map overlay on the map below.</p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setShowOverlay(!showOverlay)}
        >
          {showOverlay ? 'Hide' : 'Show'} Overlay
        </button>
        <button
          type="button"
          className="counter"
          onClick={toggleContrast}
          aria-pressed={highContrast}
          aria-label="Toggle high‑contrast mode"
        >
          {highContrast ? 'Normal Contrast' : 'High Contrast'}
        </button>
      </section>

      <div role="region" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px' }}></div>

      <MapOverlay show={showOverlay} highContrast={highContrast} />
      <MapBranding />
      <TrafficLegend />
      <TrafficAlertToast alerts={alerts} />

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
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
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
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
    </>
  )
}

export default App
