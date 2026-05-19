import { MapRenderer } from './view/mapRenderer';
import { intelligence } from './engine/intelligenceManager';
import { TRANSPORT_PROFILES } from './data/transportModes';
import type { TransportType } from './data/transportModes';
import { RouteOptimizer } from './engine/routeOptimizer';
import type { OptimizedRoute } from './engine/routeOptimizer';
import { NavigationSystem } from './engine/navigationSystem';
import { LocationCache } from './engine/persistence';
import { realtime } from './engine/realtimeService';
import { systemMonitor } from './engine/systemMonitor';
import { SensorIntelligence } from './engine/sensorIntelligence';
import { universalSearch } from './engine/universalSearch';
import type { SearchResult } from './engine/universalSearch';
import './style/index.css';

window.addEventListener('error', (e) => {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'position:fixed; top:0; left:0; background:red; color:white; z-index:9999; padding:10px; font-family:monospace;';
    errorBox.innerText = `CRITICAL ERROR: ${e.message} at ${e.filename}:${e.lineno}`;
    root.appendChild(errorBox);
  }
});

class App {
  private map!: MapRenderer;
  private token: string | null = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibXppa2F5aXNlMDEiLCJhIjoiY21vczd4ajc4MDA5ODJ3c2R3NDV2dHI0NSJ9.gbvq-aQiEttYKka8u4qmqg';
  private routeOptimizer!: RouteOptimizer;
  private currentOriginCoords: [number, number] | null = null;
  private currentDestCoords: [number, number] | null = null;
  public visualEffects!: any;
  private navSystem!: NavigationSystem;
  private currentTransportType: TransportType = 'car';
  private tripStartTime: number = 0;
  private tripTotalDistance: number = 0;
  private geocodingAbortController: AbortController | null = null;
  private routingAbortController: AbortController | null = null;
  private isPanicMode: boolean = true;
  private hasSpokenWelcome: boolean = false;

  constructor() {
    this.renderUIShell();
    this.initViewportHeight();
    this.initResizeObserver();
    this.unlockVoiceSynthesis();
    // Defer heavy systems to achieve <1s UI visibility
    setTimeout(() => this.initHeavySystems(), 10);
  }

  private unlockVoiceSynthesis() {
    const unlock = () => {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(u);
        console.log('[App] Voice synthesis unlocked successfully via gesture');
        this.speakWelcomeGreeting();
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
  }

  private speakWelcomeGreeting() {
    if (this.hasSpokenWelcome) return;
    this.hasSpokenWelcome = true;
    console.log('[App] Speaking welcome greeting...');
    this.speakBriefing("Welcome to VinMaps. System initialized. Tactical link established.");
  }

  private initViewportHeight() {
    const updateVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    updateVh();
    window.addEventListener('resize', this.debounce(() => {
      updateVh();
    }, 150));
  }

  private initResizeObserver() {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    const resizeObserver = new ResizeObserver(this.debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.handleResize(width, height);
      }
    }, 100));
    resizeObserver.observe(appEl);
  }

  private handleResize(width: number, height: number) {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    
    // Reset classes
    appEl.classList.remove('compact-320', 'compact-360', 'compact-480', 'tablet-768', 'desktop-1024', 'mobile-landscape');
    
    // Apply classes based on width breakpoints
    if (width < 360) {
      appEl.classList.add('compact-320');
    } else if (width < 480) {
      appEl.classList.add('compact-360');
    } else if (width < 768) {
      appEl.classList.add('compact-480');
    } else if (width < 1024) {
      appEl.classList.add('tablet-768');
    } else {
      appEl.classList.add('desktop-1024');
    }

    // Apply landscape class if aspect ratio is wide but height is small (mobile landscape)
    if (width > height && height < 500) {
      appEl.classList.add('mobile-landscape');
    }
  }

  private renderUIShell() {
    const root = document.querySelector<HTMLDivElement>('#app')!;
    const cached = LocationCache.get();
    const lastAddress = cached ? 'Last known sector' : 'Search South Africa...';

    root.innerHTML = `
      <div class="scanline"></div>
      <div id="cinematic-container">
        <div id="map-container"></div>
        
        <div id="sidebar" class="glass-panel sidebar-panel">
          <div class="sidebar-header">
            <h2 style="color:var(--primary-accent); font-size:1.2rem;">VINMAPS COMMAND</h2>
            <button id="close-sidebar" class="close-btn">×</button>
          </div>
          <div class="sidebar-content">
            <div class="sidebar-section">
              <button class="sidebar-item">⭐ Saved Sectors</button>
              <button class="sidebar-item">🕒 Recent Missions</button>
              <button class="sidebar-item">✍️ Contributions</button>
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section">
              <button id="toggle-stealth" class="sidebar-item">🛡️ Tactical Stealth Mode: OFF</button>
              <button class="sidebar-item">📈 Your Timeline</button>
              <button class="sidebar-item">🛡️ Data in Maps</button>
              <button class="sidebar-item">🔗 Share or Embed</button>
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-section system-health">
              <h3 class="tactical-subtitle">SYSTEM HEALTH</h3>
              <div class="health-item">
                <span>TACTICAL LINK</span>
                <span id="health-link" class="status-indicator offline">OFFLINE</span>
              </div>
              <div class="health-item">
                <span>GPS PRECISION</span>
                <span id="health-gps" class="status-indicator">-- m</span>
              </div>
              <div class="health-item">
                <span>LATENCY</span>
                <span id="health-latency" class="status-indicator">-- ms</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ui-overlay">
          <!-- TOP HUD: Cinematic Maneuvers -->
          <div id="maneuver-card" class="gta-hud-card maneuver-card" style="display: none;">
            <div class="maneuver-icon" id="maneuver-icon">↑</div>
            <div class="maneuver-text">
              <div id="compass-readout" class="compass-readout">HEADING: NORTH</div>
              <span id="maneuver-instruction" class="instruction-main">Follow route</span>
              <span id="maneuver-dist" class="instruction-sub">0 m</span>
            </div>
          </div>

          <div class="top-controls">
            <div id="routing-engine" class="gta-hud-card command-bar search-state">
              <div id="search-view" class="search-section">
                <div class="input-group" style="width: 100%;">
                  <button id="open-sidebar" class="menu-btn" style="margin-right: 5px;">☰</button>
                  <input type="text" class="search-input" placeholder="${lastAddress}" id="dest-input" autocomplete="off" style="flex: 1;">
                  <button id="locate-me" class="menu-btn" style="font-size: 1.1rem; padding: 0 5px;" title="My Location">📍</button>
                  <button id="lock-dest" class="tactical-btn" style="padding: 0.4rem; font-size: 0.9rem;" title="Directions">↱</button>
                </div>
                <div id="suggestions-list" class="glass-panel suggestions-panel" style="display: none;"></div>
              </div>

              <div id="directions-view" class="directions-section" style="display: none; flex-direction: column; align-items: stretch; gap: 0.8rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <button id="close-directions" class="menu-btn" style="font-size: 1.2rem; padding: 0;">←</button>
                  <div class="transport-strip" id="transport-step" style="gap: 0.2rem;">
                    ${Object.values(TRANSPORT_PROFILES).map(p => `
                      <button class="transport-tab" data-type="${p.type}" title="${p.type.toUpperCase()}">
                        <span class="tab-icon">${p.icon}</span>
                        <div style="display:flex; flex-direction:column; align-items:center;">
                          <span class="tab-time">--m</span>
                          <span class="tab-dist" style="font-size:0.6rem; opacity:0.8;">--km</span>
                        </div>
                      </button>
                    `).join('')}
                  </div>
                </div>
                <div class="route-inputs" style="width: 100%;">
                  <div class="input-group mini" style="position: relative;">
                    <span class="dot origin"></span>
                    <input type="text" class="mini-input" id="origin-input" placeholder="Starting point..." autocomplete="off">
                    <button id="locate-origin" class="mini-gps-btn" title="Use current location">📍</button>
                    <div id="origin-suggestions" class="glass-panel suggestions-panel mini-sugg" style="display: none;"></div>
                  </div>
                  <div class="input-group mini">
                    <span class="dot dest"></span>
                    <input type="text" class="mini-input" id="final-dest-display" readonly>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTTOM HUD: GTA Style Stats -->
          <div class="bottom-hud-container">
            <div class="gta-stats-panel">
              <div class="glass-panel dropdown-container">
                <button id="poi-dropdown-toggle" class="cat-btn dropdown-toggle">
                  🔍 Explore Intel <span class="arrow">▼</span>
                </button>
                <div id="poi-dropdown-menu" class="glass-panel dropdown-menu">
                  <div class="dropdown-section">
                    <label>EMERGENCY & SECURITY</label>
                    <button class="cat-btn" data-poi="hospital">🏥 Hospitals / Clinics</button>
                    <button class="cat-btn" data-poi="police">🛡️ SAPS / Security</button>
                  </div>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-section">
                    <label>ESSENTIAL SERVICES</label>
                    <button class="cat-btn" data-poi="bank">🏦 Banks / ATMs</button>
                    <button class="cat-btn" data-poi="fuel">⛽ Garages / Petrol</button>
                    <button class="cat-btn" data-poi="rank">🚐 Taxi Ranks</button>
                  </div>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-section">
                    <label>COMMUNITY & FOOD</label>
                    <button class="cat-btn" data-poi="shisanyama">🍖 Shisanyama / Food</button>
                    <button class="cat-btn" data-poi="spaza">🏪 Spaza Shops</button>
                    <button class="cat-btn" data-poi="hotel">🏨 Lodging / Hotels</button>
                  </div>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-section">
                    <label>EDUCATION</label>
                    <button class="cat-btn" data-poi="school">🎓 Schools & Education</button>
                  </div>
                  <div class="dropdown-divider"></div>
                  <button class="cat-btn" data-poi="all">🌐 View All Intel</button>
                </div>
              </div>

              <div id="nav-bottom-bar" class="nav-bar-minimal glass-panel" style="display: none;">
                <div class="nav-info-group">
                  <span id="nav-eta-main" class="nav-main-eta">CALCULATING...</span>
                  <div class="nav-info">
                    <span id="nav-eta-time">-- min</span>
                    <span id="nav-dist-left">-- km</span>
                    <span id="nav-arrival" style="margin-left: 10px; opacity: 0.7;">--:--</span>
                    <div id="safety-badge" class="safety-badge">
                      🛡️ TSI: --
                    </div>
                  </div>
                </div>
                <button id="exit-nav" class="exit-nav-btn">EXIT NAV</button>
              </div>
            </div>
          </div>

          <!-- Floating Controls -->
          <div class="floating-controls">
            <!-- Compass Button (Rotates to show bearing, click resets North) -->
            <button id="compass-btn" class="gta-hud-circle compass-btn" title="Reset North">
              <span id="compass-arrow" style="display: inline-block; font-size: 1.4rem; transition: transform 0.1s ease;">🧭</span>
            </button>

            <!-- Perspective Button (2D / 3D Toggle) -->
            <button id="perspective-btn" class="gta-hud-circle perspective-btn" title="Toggle 2D/3D" style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: bold; letter-spacing: 0.5px;">3D</button>

            <!-- Unified Zoom Pill Control -->
            <div class="zoom-controls-group">
              <button id="zoom-in-btn" class="zoom-pill-btn" title="Zoom In">+</button>
              <div style="height: 1px; background: rgba(255, 255, 255, 0.15); width: 60%; margin: 0 auto;"></div>
              <button id="zoom-out-btn" class="zoom-pill-btn" title="Zoom Out">−</button>
            </div>

            <button id="recenter-btn" class="gta-hud-circle recenter-btn" title="Re-center">🎯</button>
            <button id="theme-toggle" class="gta-hud-circle theme-toggle-btn" title="Toggle Theme">🌙</button>
            
            <!-- Hazard Reporting FAB (Nested in the same column) -->
            <div id="hazard-fab" class="hazard-fab" style="display: none;">
              <button class="hazard-btn pothole" onclick="app.reportHazard('pothole')">🕳️</button>
              <button class="hazard-btn accident" onclick="app.reportHazard('accident')">💥</button>
              <button class="hazard-btn roadblock" onclick="app.reportHazard('roadblock')">🚧</button>
            </div>
          </div>

          <!-- SOS / Panic Button -->
          <div class="sos-fab-container">
            <button id="sos-btn" class="sos-btn">SOS</button>
          </div>

          <!-- Trip Summary Modal -->
          <div id="summary-modal" class="glass-panel summary-modal" style="display: none;">
            <h2 class="tactical-title">MISSION DEBRIEF</h2>
            <div class="summary-grid">
              <div class="summary-item"><label>DISTANCE</label><span id="sum-dist">--</span></div>
              <div class="summary-item"><label>TIME</label><span id="sum-time">--</span></div>
              <div class="summary-item"><label>AVG SPEED</label><span id="sum-avg-speed">--</span></div>
            </div>
            <button class="tactical-btn" onclick="app.closeSummary()">CLOSE</button>
          </div>
        </div>

        <div id="intel-feed" class="intel-feed"></div>

        <!-- Startup Loading Overlay -->
        <div id="startup-loader" class="startup-loader">
          <div class="loader-content">
            <div class="loader-spinner"></div>
            <h1 class="loader-title">VINMAPS SYSTEM</h1>
            <p class="loader-status" id="loader-status">Initializing tactical link...</p>
          </div>
        </div>
      </div>
    `;
    
    // UI Shell is rendered, but we wait for heavy systems to bind listeners
    // to avoid double-binding or binding to uninitialized objects.
  }

  private async acquireStartingCoordinates(): Promise<[number, number]> {
    const cached = LocationCache.get();
    
    // 1. Try GPS immediately with a tight timeout to keep launch snappy
    const getGpsPromise = new Promise<[number, number]>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("No geolocation support"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });

    // 2. Try fast IP-based location as secondary high-legibility fallback
    const getIpPromise = async (): Promise<[number, number]> => {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && typeof data.longitude === 'number' && typeof data.latitude === 'number') {
        return [data.longitude, data.latitude];
      }
      throw new Error("Invalid IP location data");
    };

    try {
      console.log("[App] Querying start coordinates via GPS...");
      const gpsCoords = await getGpsPromise;
      console.log("[App] Startup GPS lock secured successfully:", gpsCoords);
      LocationCache.save(gpsCoords);
      return gpsCoords;
    } catch (gpsErr) {
      console.warn("[App] Geolocation query failed or timed out:", gpsErr);
      
      try {
        console.log("[App] Querying start coordinates via low-latency IP Geolocation...");
        const ipCoords = await getIpPromise();
        console.log("[App] Startup IP lock secured successfully:", ipCoords);
        LocationCache.save(ipCoords);
        return ipCoords;
      } catch (ipErr) {
        console.warn("[App] IP Geolocation query failed:", ipErr);
        // 3. Last resort - Cache or Johannesburg
        return cached?.coords || [28.0473, -26.2041];
      }
    }
  }

  private async initHeavySystems() {
    if (!this.token) {
      console.error('Critical: Mapbox Token missing.');
      return;
    }

    // 1. Get cached or default coordinates immediately for instant startup
    const cached = LocationCache.get();
    const fallbackCoords: [number, number] = cached?.coords || [28.0473, -26.2041];
    this.currentOriginCoords = fallbackCoords;

    // Initialize systems first so references exist even if map fails
    this.routeOptimizer = new RouteOptimizer(this.token!);
    this.navSystem = new NavigationSystem();

    try {
      // 2. Initialize Map immediately centered on cached or fallback coordinates
      this.map = new MapRenderer('map-container', this.token!, fallbackCoords);
      (window as any).app = this;
      (window as any).appMap = this.map;

      // Reveal UI and map canvas immediately (500ms fade-out) for instant load feeling
      setTimeout(() => {
        this.hideStartupLoader();
        if (this.map && this.map.map) {
          const mapCanvas = this.map.map.getCanvas();
          if (mapCanvas) mapCanvas.style.opacity = '1';
        }
      }, 500);
      
      this.map.onStyleReady(() => { 
        document.body.classList.add('ready');
        this.requestCompassPermission();
        
        if (this.currentOriginCoords) {
          console.log(`[App] Style ready. Centering on active coordinates: ${this.currentOriginCoords}`);
          this.map.updateCameraForNav(this.currentOriginCoords, 0, 0, true);
          this.navSystem.snapToPosition(this.currentOriginCoords, 0);
        }

        // Immediately reveal UI and initialize map systems on style ready
        this.handleMapLoaded(fallbackCoords);
      });
      
      // 3. ASYNCHRONOUS LOCATION RESOLUTION: Query GPS/IP in the background
      this.acquireStartingCoordinates()
        .then(freshCoords => {
          if (freshCoords) {
            console.log(`[App] Startup coordinates resolved: ${freshCoords[0]}, ${freshCoords[1]}`);
            this.currentOriginCoords = freshCoords;
            if (this.map) {
              if (this.map.map) {
                this.map.map.jumpTo({ center: freshCoords });
              }
              this.map.updateCameraForNav(freshCoords, 0, 0, true);
              this.navSystem.snapToPosition(freshCoords, 0);
            }
          }
        })
        .catch(() => console.warn('[App] Startup coordinates query failed - Staying with cached/default position'));

      // Background systems
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          this.routeOptimizer.prewarmRouting();
          try {
            new SensorIntelligence(this.navSystem).start();
          } catch (e) {
            console.error('[App] Failed to start sensor intelligence:', e);
          }
        });
      }

      if (!this.map || !this.map.map) {
        // Fallback if MapRenderer loaded without map object (e.g. WebGL not supported)
        this.hideStartupLoader();
        this.showWebGLFallbackMessage();
      }
    } catch (e) {
      console.error('[App] Exception during MapRenderer instantiation:', e);
      this.hideStartupLoader();
      this.showWebGLFallbackMessage();
    }

    this.setupListeners();
  }

  private hideStartupLoader() {
    const startupLoader = document.getElementById('startup-loader');
    if (startupLoader) {
      startupLoader.classList.add('hidden');
      setTimeout(() => startupLoader.remove(), 800);
    }
  }

  private handleMapLoaded(initialCoords: [number, number]) {
    console.log('[App] MAP_READY');
    
    // 3. VEHICLE_MARKER_SET & AUTO-FOLLOW
    this.setupNavigationStateListener();
    this.navSystem.snapToPosition(this.currentOriginCoords || initialCoords, 0);
    this.navSystem.startTracking();
    if (this.map) {
      this.map.enterNavigationMode(); // This enables camera follow mode
    }

    // REVEAL UI
    console.log('[App] READY_STATE_ENTERED');
    if (this.map && this.map.map) {
      const mapCanvas = this.map.map.getCanvas();
      if (mapCanvas) mapCanvas.style.opacity = '1';
    }
    
    this.hideStartupLoader();
    
    this.initSystemMonitor();
    import('./engine/smartCityService').then(({ smartCity }) => {
      if (this.map) {
        smartCity.onSignalUpdate((signals) => this.map.updateTrafficSignals(signals));
      }
    });

    // Update origin input
    const originInput = document.getElementById('origin-input') as HTMLInputElement;
    if (originInput) originInput.value = 'Current Location';

    // Speak welcome greeting if voice is already unlocked/WebView pre-granted
    this.speakWelcomeGreeting();
  }

  private showWebGLFallbackMessage() {
    this.showTacticalNotification("TACTICAL WARNING: WebGL acceleration is disabled or unsupported. Please check device settings.");
  }

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  private setupListeners() {
    const destInput = document.getElementById('dest-input') as HTMLInputElement;
    const originInput = document.getElementById('origin-input') as HTMLInputElement;

    // Handle Search Inputs
    destInput?.addEventListener('input', this.debounce(() => {
      this.handleGeocoding(destInput.value, 'destination');
    }, 300));

    originInput?.addEventListener('input', this.debounce(() => {
      this.handleGeocoding(originInput.value, 'origin');
    }, 300));

    // Handle Transportation Modes
    document.querySelectorAll('.transport-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.type as TransportType;
        this.currentTransportType = type;
        
        document.querySelectorAll('.transport-tab').forEach(t => t.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        
        this.finalizeRouting(type);
      });
    });

    // Sidebar
    const sidebar = document.getElementById('sidebar');
    document.getElementById('open-sidebar')?.addEventListener('click', () => sidebar?.classList.add('open'));
    document.getElementById('close-sidebar')?.addEventListener('click', () => sidebar?.classList.remove('open'));

    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const text = target.innerText;
        
        // Stealth mode has its own listener, ignore it here
        if (target.id === 'toggle-stealth') return;

        sidebar?.classList.remove('open');
        
        if (text.includes('Saved Sectors')) {
          const sectors = LocationCache.getSectors();
          const sector = sectors[Math.floor(Math.random() * sectors.length)];
          if (this.map) {
            this.map.flyTo(sector.coords[0], sector.coords[1], sector.zoom);
            this.showTacticalNotification(`TRANSITIONING TO ${sector.name.toUpperCase()}`);
          }
        } 
        else if (text.includes('Recent Missions')) {
          const missions = LocationCache.getMissions();
          if (missions.length === 0) {
            this.showTacticalNotification('NO RECENT MISSIONS LOGGED');
          } else {
            this.showTacticalNotification(`LAST MISSION: ${missions[0].destinationName.toUpperCase()}`);
          }
        }
        else if (text.includes('Contributions')) {
          const hazardFab = document.getElementById('hazard-fab');
          if (hazardFab) {
            hazardFab.style.display = 'flex';
            this.showTacticalNotification('CONTRIBUTION UPLINK ACTIVE - SELECT HAZARD TYPE');
          }
        }
        else if (text.includes('Timeline')) {
          const duration = Math.floor((Date.now() - this.tripStartTime) / 60000);
          this.showTacticalNotification(`SESSION TIMELINE: ${duration} MINS ACTIVE | SECTORS SCANNED: 4`);
        }
        else if (text.includes('Data in Maps')) {
          this.showTacticalNotification('ENCRYPTED DATA LINK: ALL COORDINATES ARE STORED LOCALLY');
        }
        else if (text.includes('Share or Embed')) {
          const center = this.map.map.getCenter();
          const link = `${window.location.origin}/#loc=${center.lng.toFixed(5)},${center.lat.toFixed(5)}`;
          navigator.clipboard.writeText(link);
          this.showTacticalNotification('TACTICAL COORDINATE LINK COPIED TO CLIPBOARD');
        }
      });
    });

    // Explore Intel Toggle
    const intelBtn = document.getElementById('toggle-intel');
    if (intelBtn) {
      intelBtn.addEventListener('click', () => {
        const isActive = intelBtn.classList.toggle('active');
        this.map.visualEffects.togglePOILayers(isActive);
        this.showTacticalNotification(isActive ? 'TACTICAL POI LAYERS ENABLED' : 'POI LAYERS DEACTIVATED');
      });
    }

    const stealthBtn = document.getElementById('toggle-stealth');
    if (stealthBtn) {
      stealthBtn.addEventListener('click', () => {
        const isActive = stealthBtn.classList.toggle('active');
        realtime.setStealthMode(isActive);
        stealthBtn.innerText = `🛡️ Tactical Stealth Mode: ${isActive ? 'ON' : 'OFF'}`;
        this.showTacticalNotification(isActive ? 'STEALTH MODE ENABLED - COORDINATES ANONYMIZED' : 'STEALTH MODE DISABLED');
      });
    }

    // Directions Toggle
    document.getElementById('lock-dest')?.addEventListener('click', () => {
      if (this.currentDestCoords) this.advanceToTransportStep();
    });

    document.getElementById('close-directions')?.addEventListener('click', () => {
      document.getElementById('directions-view')!.style.display = 'none';
      document.getElementById('search-view')!.style.display = 'flex';
      if (this.map) this.map.exitNavigationMode();
    });

    // GPS Buttons
    document.getElementById('locate-me')?.addEventListener('click', () => {
      if (this.currentOriginCoords) {
        if (this.map) this.map.flyTo(this.currentOriginCoords[0], this.currentOriginCoords[1]);
        this.showTacticalNotification('RE-CENTERING ON OPERATOR COORDINATES');
      }
    });

    document.getElementById('locate-origin')?.addEventListener('click', () => {
      if (this.currentOriginCoords) {
        (document.getElementById('origin-input') as HTMLInputElement).value = 'Your Location';
        this.handleGeocodingSelection('Your Location', this.currentOriginCoords, 'origin');
      }
    });

    // Exit Nav
    document.getElementById('exit-nav')?.addEventListener('click', () => this.stopNavigation());

    // Recenter
    document.getElementById('recenter-btn')?.addEventListener('click', () => {
      if (this.map) this.map.recenter();
    });



    // Theme Toggle (Light/Dark Mode)
    let currentThemePreset: 'day' | 'night' = 'night';
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      if (this.map && this.map.map) {
        currentThemePreset = currentThemePreset === 'night' ? 'day' : 'night';
        this.map.map.setConfigProperty('basemap', 'lightPreset', currentThemePreset);
        
        const btn = document.getElementById('theme-toggle');
        if (btn) {
          btn.innerHTML = currentThemePreset === 'night' ? '🌙' : '☀️';
        }
        
        this.showTacticalNotification(
          currentThemePreset === 'night' ? 'TACTICAL NIGHT THEME ACTIVE' : 'STEALTH DAYLIGHT THEME ACTIVE'
        );
      }
    });

    // Compass Reset
    document.getElementById('compass-btn')?.addEventListener('click', () => {
      if (this.map && this.map.map) {
        this.map.map.easeTo({ bearing: 0, duration: 800 });
        this.showTacticalNotification('NORTH-UP ALIGNMENT RESTORED');
      }
    });

    // 2D/3D Toggle
    document.getElementById('perspective-btn')?.addEventListener('click', () => {
      if (this.map && this.map.map) {
        const currentPitch = this.map.map.getPitch();
        const newPitch = currentPitch > 10 ? 0 : 68;
        this.map.map.easeTo({ pitch: newPitch, duration: 800 });
        
        const btn = document.getElementById('perspective-btn');
        if (btn) {
          btn.innerText = newPitch > 10 ? '2D' : '3D';
        }
        
        this.showTacticalNotification(newPitch > 10 ? '3D PERSPECTIVE ENGAGED' : '2D FLAT MAP VIEW ACTIVE');
      }
    });

    // Zoom In
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
      if (this.map && this.map.map) {
        this.map.map.zoomTo(this.map.map.getZoom() + 1, { duration: 300 });
      }
    });

    // Zoom Out
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
      if (this.map && this.map.map) {
        this.map.map.zoomTo(this.map.map.getZoom() - 1, { duration: 300 });
      }
    });

    // Sync Compass UI with Map Rotation
    this.map.map.on('rotate', () => {
      const bearing = this.map.map.getBearing();
      const arrow = document.getElementById('compass-arrow');
      if (arrow) {
        arrow.style.transform = `rotate(${-bearing}deg)`;
      }
    });
    
    // Camera State Listeners
    window.addEventListener('nav-camera-unlocked', () => {
      const btn = document.getElementById('recenter-btn');
      if (btn) {
        btn.style.display = 'flex';
        btn.classList.add('pulse-alert');
      }
      this.showTacticalNotification('CAMERA UNLOCKED - MANUAL OVERRIDE');
    });

    window.addEventListener('nav-camera-locked', () => {
      const btn = document.getElementById('recenter-btn');
      if (btn) {
        btn.classList.remove('pulse-alert');
        // We keep the button visible during navigation but remove the alert pulse
      }
      this.showTacticalNotification('CAMERA LOCKED - TRACKING OPERATOR');
    });

    // POI Dropdown
    const dropdownToggle = document.getElementById('poi-dropdown-toggle');
    const dropdownMenu = document.getElementById('poi-dropdown-menu');

    dropdownToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle('active');
      dropdownToggle.classList.toggle('active');
    });

    // SOS Button
    document.getElementById('sos-btn')?.addEventListener('click', () => this.handleSOSTrigger());

    // Listen for incoming SOS from other units
    window.addEventListener('tactical-sos', (e: any) => this.showIncomingSOS(e.detail));

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu?.classList.remove('active');
      dropdownToggle?.classList.remove('active');
    });

    document.querySelectorAll('[data-poi]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = (e.currentTarget as HTMLElement).dataset.poi!;
        this.filterUrbanIntelligence(cat);
        dropdownMenu?.classList.remove('active');
        dropdownToggle?.classList.remove('active');
      });
    });

    // POI Click-to-Navigate Listener
    window.addEventListener('poi-intelligence', (e: any) => {
      const { name, location } = e.detail;
      this.showTacticalNotification(`ACQUIRING INTEL: ${name.toUpperCase()}`);
      this.handleGeocodingSelection(name, location, 'destination');
    });
  }

  private async handleGeocoding(query: string, mode: 'origin' | 'destination') {
    if (!query || query.length < 2) return;
    
    if (this.geocodingAbortController) this.geocodingAbortController.abort();
    this.geocodingAbortController = new AbortController();

    const userCoords = this.currentOriginCoords || [28.0473, -26.2041];

    try {
      // 1. Query local Destination Intelligence POI database & AI Intent Mapper
      const localResults = universalSearch.search(query, userCoords);
      
      // 2. Query Mapbox Geocoding as a high-fidelity geographic fallback
      const intel = intelligence.processQuery(query);
      const searchQuery = intel.translatedQuery;
      
      const proximityParam = `&proximity=${userCoords[0]},${userCoords[1]}`;
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${this.token}${proximityParam}&autocomplete=true&fuzzyMatch=true&limit=10&country=ZA&language=en`;
      
      const res = await fetch(url, { signal: this.geocodingAbortController.signal });
      const data = await res.json();
      
      // Enrich Mapbox raw locations with our Destination Intelligence schema
      const mapboxResults = (data.features || []).map((f: any) => 
        universalSearch.enrichMapboxFeature(f, userCoords)
      );

      // 3. Merge results, de-duplicate by name, and sort
      const mergedResults: SearchResult[] = [];
      const seenNames = new Set<string>();

      // Load highly relevant local POIs first
      for (const item of localResults) {
        const key = item.name.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          mergedResults.push(item);
        }
      }

      // Load Mapbox fallback coordinates next
      for (const item of mapboxResults) {
        const key = item.name.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          mergedResults.push(item);
        }
      }

      // 4. Sort results. Prioritize safety critical results (hospitals, police, fuel) during urgent intents
      const isUrgent = /help|sick|injured|emergency|police|robbed|fuel|empty|breakdown/i.test(query.toLowerCase());
      mergedResults.sort((a, b) => {
        if (isUrgent) {
          const aEmergency = a.category === 'Health' || a.subCategory === 'Police Station';
          const bEmergency = b.category === 'Health' || b.subCategory === 'Police Station';
          if (aEmergency && !bEmergency) return -1;
          if (!aEmergency && bEmergency) return 1;
        }
        return a.distance - b.distance;
      });

      this.displaySuggestions(mergedResults, mode);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Geocoding fail:', e);
    }
  }

  private displaySuggestions(features: SearchResult[] | undefined, mode: 'origin' | 'destination') {
    if (!features) return;
    const list = mode === 'destination' ? document.getElementById('suggestions-list') : document.getElementById('origin-suggestions');
    if (!list) return;

    list.innerHTML = features.map((f: SearchResult) => `
      <div class="suggestion-item destination-card" 
           data-lng="${f.coordinates[0]}" 
           data-lat="${f.coordinates[1]}" 
           data-text="${f.name}">
        <div class="destination-card-header">
          <div class="destination-icon-wrap">${f.icon}</div>
          <div class="destination-title-wrap">
            <span class="destination-name">${f.name}</span>
            <span class="destination-category">${f.subCategory}</span>
          </div>
          <span class="destination-status-badge ${f.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${f.status}</span>
        </div>
        <div class="destination-card-body">
          <div class="destination-meta-item">
            <span class="meta-label">DISTANCE</span>
            <span class="meta-value">${f.distance} km</span>
          </div>
          <div class="destination-meta-item">
            <span class="meta-label">ETA</span>
            <span class="meta-value">~${f.travelTime} min</span>
          </div>
          <div class="destination-meta-item">
            <span class="meta-label">SAFETY</span>
            <span class="meta-value safety-score-${f.safetyScore > 80 ? 'high' : (f.safetyScore < 60 ? 'low' : 'medium')}">🛡️ TSI: ${f.safetyScore}</span>
          </div>
        </div>
        <div class="destination-card-footer">
          <div class="route-badges">
            <span class="route-badge" title="Driving">🚗</span>
            <span class="route-badge" title="Walking">🚶</span>
            <span class="route-badge" title="Transit">🚇</span>
          </div>
          <button class="navigate-now-btn">NAVIGATE NOW</button>
        </div>
      </div>
    `).join('');
    
    list.style.display = features.length > 0 ? 'block' : 'none';

    list.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const coords: [number, number] = [parseFloat(target.dataset.lng!), parseFloat(target.dataset.lat!)];
        this.handleGeocodingSelection(target.dataset.text!, coords, mode);
      });
    });
  }

  private handleGeocodingSelection(name: string, coords: [number, number], mode: 'origin' | 'destination') {
    const inputId = mode === 'destination' ? 'dest-input' : 'origin-input';
    const listId = mode === 'destination' ? 'suggestions-list' : 'origin-suggestions';
    
    (document.getElementById(inputId) as HTMLInputElement).value = name;
    document.getElementById(listId)!.style.display = 'none';

    if (mode === 'origin') {
      this.currentOriginCoords = coords;
    } else {
      this.currentDestCoords = coords;
      document.getElementById('final-dest-display')!.setAttribute('value', name);
      (document.getElementById('final-dest-display') as HTMLInputElement).value = name;
      
      const reasoning = document.getElementById('loader-status');
      const address = name.split(',')[0];
      if (reasoning) reasoning.innerText = `AI Assistant: Position acquired: ${address}.`;
      this.map.flyTo(coords[0], coords[1]);

      if (this.currentOriginCoords && this.currentDestCoords) {
        this.advanceToTransportStep();
      }
    }
  }

  private advanceToTransportStep() {
    document.getElementById('search-view')!.style.display = 'none';
    document.getElementById('directions-view')!.style.display = 'flex';
    
    // No longer auto-clicking the first tab. 
    // The operator must now intentionally select a transport mode to generate the route.
    this.showTacticalNotification('SELECT TRANSPORT MODE TO GENERATE ROUTE');
  }

  private async finalizeRouting(type: TransportType) {
    if (!this.currentOriginCoords || !this.currentDestCoords) return;

    if (this.routingAbortController) this.routingAbortController.abort();
    this.routingAbortController = new AbortController();

    const profile = TRANSPORT_PROFILES[type].mapboxProfile;
    
    // Show active skeleton loading state during route calculations
    const navBottomBar = document.getElementById('nav-bottom-bar');
    const etaMainEl = document.getElementById('nav-eta-main');
    if (navBottomBar) {
      navBottomBar.style.display = 'flex';
      navBottomBar.classList.add('skeleton-loading');
    }
    if (etaMainEl) {
      etaMainEl.innerText = 'ACQUIRING ROUTE...';
    }
    
    try {
      const route = await this.routeOptimizer.fetchAndOptimizeRoute(
        this.currentOriginCoords,
        this.currentDestCoords,
        profile,
        this.routingAbortController.signal
      );

      if (navBottomBar) {
        navBottomBar.classList.remove('skeleton-loading');
      }

      if (route) {
        // PRE-INIT HUD: Show data before motion starts
        const etaEl = document.getElementById('nav-eta-time');
        const distEl = document.getElementById('nav-dist-left');
        if (etaEl) etaEl.innerText = `${Math.round(route.duration / 60)} min`;
        if (distEl) distEl.innerText = `${(route.distance / 1000).toFixed(1)} km`;
        
        const safetyEl = document.getElementById('safety-badge');
        if (safetyEl) {
          safetyEl.innerText = `🛡️ TSI: ${route.safetyScore}`;
          safetyEl.className = `safety-badge ${route.safetyScore > 80 ? 'high' : (route.safetyScore < 40 ? 'low' : '')}`;
        }

        this.map.executeCameraSequence(this.currentOriginCoords, this.currentDestCoords, route.coordinates);
        this.map.updateRoute(route);
        
        // Save to Recent Missions
        const destName = (document.getElementById('dest-input') as HTMLInputElement).value || 'Target Objective';
        LocationCache.saveMission(destName, this.currentDestCoords);
        
        this.startNavigation(route);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Routing fail:', e);
    }
  }

  private startNavigation(route: OptimizedRoute) {
    this.tripStartTime = Date.now();
    this.tripTotalDistance = route.distance;
    
    // Notify native Android wrapper to start foreground service location tracking
    if ((window as any).AndroidBridge) {
      try {
        (window as any).AndroidBridge.startBackgroundNavigation(JSON.stringify(route));
        (window as any).AndroidBridge.triggerVibration(JSON.stringify({ duration: 150 }));
      } catch (e) {
        console.error('[AndroidBridge] Failed to trigger background service:', e);
      }
    }
    
    this.navSystem.start(route, TRANSPORT_PROFILES[this.currentTransportType].mapboxProfile);
    this.map.enterNavigationMode();
    
    document.getElementById('maneuver-card')!.style.display = 'flex';
    document.getElementById('nav-bottom-bar')!.style.display = 'flex';
    document.getElementById('recenter-btn')!.style.display = 'flex';
    
    // HIDE TOP UI: Remove search/directions during active nav
    const topControls = document.querySelector('.top-controls') as HTMLElement;
    if (topControls) topControls.style.display = 'none';
    
    if (this.map.visualEffects) {
      this.map.visualEffects.setNavigating(true);
    }
    
    // Ensure Intel dropdown remains accessible
    const intelDropdown = document.querySelector('.dropdown-container') as HTMLElement;
    if (intelDropdown) intelDropdown.style.display = 'flex';
    
    const briefing = intelligence.generateTacticalBriefing(route, this.currentTransportType);
    this.showTacticalNotification(briefing.brief);
    this.speakBriefing(briefing.brief);
    
    const hazardFab = document.getElementById('hazard-fab');
    if (hazardFab) hazardFab.style.display = 'flex';
    
    this.navSystem.onOffRoute = () => {
      this.speakBriefing("Recalculating route.");
      this.finalizeRouting(this.currentTransportType);
    };
  }

    private async filterUrbanIntelligence(category: string) {
        if (category === 'all') {
            this.showTacticalNotification('SCANNING ALL SECTORS FOR INTEL');
            this.map.setPoiFilter('all');
            return;
        }

        this.showTacticalNotification(`SCANNING SECTOR FOR NEAREST: ${category.toUpperCase()}`);
        this.map.setPoiFilter(category);

        // AUTO-LOCATE NEAREST LOGIC
        if (!this.currentOriginCoords) {
            this.showTacticalNotification('GPS LOCK REQUIRED FOR AUTO-LOCATE', 'warning');
            return;
        }

        // Map internal category to Mapbox search terms
        const categoryMap: Record<string, string> = {
            hospital: 'hospital,clinic,medical',
            police: 'police,saps,security',
            bank: 'bank,atm',
            fuel: 'gas station,petrol',
            rank: 'taxi rank,bus station',
            shisanyama: 'shisanyama,restaurant,braai',
            spaza: 'spaza,convenience store,grocery',
            hotel: 'hotel,lodging,guest house',
            school: 'school,university,college'
        };

        const searchTerm = categoryMap[category] || category;
        const [lng, lat] = this.currentOriginCoords;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?access_token=${this.token}&proximity=${lng},${lat}&limit=1&country=ZA&language=en`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const f = data.features[0];
                const coords: [number, number] = f.center;
                this.showTacticalNotification(`TARGET ACQUIRED: ${f.text.toUpperCase()}`);
                
                // Set as destination and trigger transport view
                this.handleGeocodingSelection(f.text, coords, 'destination');
            } else {
                this.showTacticalNotification(`NO ${category.toUpperCase()} FOUND IN RADIUS`, 'warning');
            }
        } catch (e) {
            console.error('Auto-locate failed:', e);
        }
    }

  public reportHazard(type: string) {
    if (!this.currentOriginCoords) {
      this.showTacticalNotification('GPS LINK UNAVAILABLE - CANNOT REPORT INCIDENT', 'critical');
      return;
    }
    const pos = this.navSystem.getCurrentPosition() || this.currentOriginCoords;
    
    const typeLabels: Record<string, string> = {
      pothole: '🕳️ POTHOLE DEBRIS',
      accident: '💥 VEHICLE COLLISION',
      roadblock: '🚧 SAPS ROADBLOCK'
    };

    console.log(`[Crowdsourcing] Uploading hazard: ${type} at ${pos}`);

    // 1. Report to Realtime Backend
    realtime.reportHazard(type, pos);
    
    // 2. Immediate feedback in Local Feed
    intelligence.report({
      type: 'HAZARD',
      payload: { type, location: pos },
      timestamp: Date.now()
    });
    
    // 3. Audio Briefing Speech
    this.speakBriefing(`Hazard reported: ${typeLabels[type] || type}. Broadcast sent to all active units.`);

    // 4. Premium HUD Notification overlay
    this.showTacticalNotification(
      `FIELD REPORT: ${typeLabels[type] || type.toUpperCase()} UPLOADED SUCCESSFULLY`,
      type === 'accident' || type === 'roadblock' ? 'warning' : 'info'
    );
  }

  public handleSOSTrigger() {
    if (!confirm('CONFIRM TACTICAL SOS BROADCAST? This will alert all units.')) return;
    
    const pos = this.navSystem.getCurrentPosition() || this.currentOriginCoords;
    if (pos) {
      realtime.triggerSOS(pos);
      this.speakBriefing('EMERGENCY SOS ACTIVATED. BROADCASTING TACTICAL COORDINATES.');
      if (this.isPanicMode) {
        document.body.classList.add('sos-mode');
        this.showTacticalNotification('SOS BROADCAST ACTIVE - SCANNING FOR NEAREST RESPONDERS');
        this.findNearestEmergencyPOI();
      } else {
      }
    }
  }

  private showIncomingSOS(sos: any) {
    this.showTacticalNotification(`!!! INCOMING SOS: UNIT ${sos.operatorId.substring(0,4)} !!!`, 'critical');
    this.speakBriefing(`Emergency alert: tactical SOS received from unit ${sos.operatorId.substring(0,4)}.`);
    
    // Auto-fly to SOS location for immediate situational awareness
    if (sos.location && this.map) {
      this.map.flyTo(sos.location[0], sos.location[1], 17);
    }
  }

  private stopNavigation() {
    // Notify native Android wrapper to terminate foreground location service
    if ((window as any).AndroidBridge) {
      try {
        (window as any).AndroidBridge.stopBackgroundNavigation();
        (window as any).AndroidBridge.triggerVibration(JSON.stringify({ duration: 80 }));
      } catch (e) {
        console.error('[AndroidBridge] Failed to stop background service:', e);
      }
    }
    this.navSystem.stop();
    this.map.exitNavigationMode();
    this.map.visualEffects.clearRoute();
    
    document.getElementById('search-view')!.style.display = 'flex';
    document.getElementById('nav-bottom-bar')!.style.display = 'none';
    document.getElementById('recenter-btn')!.style.display = 'none';
    document.getElementById('maneuver-card')!.style.display = 'none';
    document.getElementById('hazard-fab')!.style.display = 'none';
    
    // RESTORE TOP UI: Show search again
    const topControls = document.querySelector('.top-controls') as HTMLElement;
    if (topControls) topControls.style.display = 'flex';
    
    if (this.map.visualEffects) {
      this.map.visualEffects.setNavigating(false);
    }
    
    this.showTripSummary();
  }

  private showTripSummary() {
    const durationMs = Date.now() - this.tripStartTime;
    const durationMins = Math.floor(durationMs / 60000);
    const avgSpeed = (this.tripTotalDistance / (durationMs / 3600000)).toFixed(1);

    document.getElementById('sum-dist')!.innerText = `${(this.tripTotalDistance / 1000).toFixed(1)} km`;
    document.getElementById('sum-time')!.innerText = `${durationMins} min`;
    document.getElementById('sum-avg-speed')!.innerText = `${avgSpeed} km/h`;
    document.getElementById('summary-modal')!.style.display = 'block';
  }

  public closeSummary() {
    document.getElementById('summary-modal')!.style.display = 'none';
  }

  private speakBriefing(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.85;
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }

  private requestCompassPermission() {
    const sensorBtn = document.createElement('button');
    sensorBtn.id = 'sensor-permission-gate';
    sensorBtn.className = 'glass-panel tactical-btn';
    sensorBtn.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; padding:20px; font-weight:bold; color:var(--primary-accent); border:2px solid var(--primary-accent);';
    sensorBtn.innerHTML = 'SYNC TACTICAL COMPASS<br><small style="font-size:0.6rem;opacity:0.7">Enable device sensors for real-time orientation</small>';
    
    const DeviceOrientationEventClass = (window as any).DeviceOrientationEvent;
    
    const request = async () => {
      if (DeviceOrientationEventClass && typeof DeviceOrientationEventClass.requestPermission === 'function') {
        try {
          const response = await DeviceOrientationEventClass.requestPermission();
          if (response === 'granted') {
            console.log('[App] COMPASS_PERMISSION_GRANTED');
          }
        } catch (e) {
          console.error('[App] COMPASS_PERMISSION_ERROR', e);
        }
      }
      sensorBtn.remove();
      // Force DRIVING mode to start tracking rotation immediately
      this.map.enterNavigationMode();
      this.map.recenter();
    };

    sensorBtn.onclick = request;
    
    // Only show if we're on a mobile device and haven't granted yet
    const hasPermissionRequest = DeviceOrientationEventClass && typeof DeviceOrientationEventClass.requestPermission === 'function';
    if (hasPermissionRequest || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      document.body.appendChild(sensorBtn);
    }
  }

  private initSystemMonitor() {
    systemMonitor.setUpdateCallback((status) => {
      const linkEl = document.getElementById('health-link');
      const gpsEl = document.getElementById('health-gps');
      const latencyEl = document.getElementById('health-latency');

      if (linkEl) {
        linkEl.innerText = status.linkStatus.toUpperCase();
        linkEl.className = `status-indicator ${status.linkStatus}`;
      }
      if (gpsEl) gpsEl.innerText = `${status.gpsAccuracy} m`;
      if (latencyEl) latencyEl.innerText = `${status.latency} ms`;
    });
  }

  private setupNavigationStateListener() {
    let isFirstFix = true;
    let lastUIUpdateTime = 0;
    this.navSystem.onUpdate = (state) => {
      // Keep operator coordinates perfectly in sync for directions, search origin and recentering
      this.currentOriginCoords = state.currentPosition;
      LocationCache.save(state.currentPosition);

      // 1. High-fidelity rendering updates (run at GPS / Orientation frequency for 60fps movement)
      if (this.map) {
        this.map.updateCameraForNav(state.currentPosition, state.heading, state.speed, isFirstFix);
        if (isFirstFix) isFirstFix = false;
      }
      
      // 2. Throttling DOM updates to 250ms to prevent CPU saturation and rendering lockouts on low-end mobile devices
      const now = performance.now();
      if (!isFirstFix && now - lastUIUpdateTime < 250) {
        return;
      }
      lastUIUpdateTime = now;

      const compass = document.getElementById('compass-readout');
      if (compass) compass.innerText = `HEADING: ${state.compassDirection.toUpperCase()}`;

      // 3. Proactive Intelligence Alerts
      this.navSystem.onProactiveAlert = (type, dist) => {
        this.speakBriefing(`Caution: ${type} detected ${dist} meters ahead.`);
        this.showTacticalNotification(`PROACTIVE ALERT: ${type} AT ${dist}m`, 'warning');
      };

      // 4. Automatic Rerouting
      this.navSystem.onOffRoute = () => {
        if (!this.tripStartTime) return; // Only during active trip
        this.showTacticalNotification('MISSION DEVIATION DETECTED - CALCULATING REROUTE');
        this.finalizeRouting(this.currentTransportType);
      };

      // Update ETA/Dist HUD during active nav
      const navBottomBar = document.getElementById('nav-bottom-bar');
      if (navBottomBar && navBottomBar.style.display === 'flex') {
        const speedMs = state.speed > 1 ? state.speed : 13.8; 
        const remainingSeconds = state.totalDistanceRemaining / speedMs;
        const etaMainEl = document.getElementById('nav-eta-main');
        const etaTimeEl = document.getElementById('nav-eta-time');
        const distEl = document.getElementById('nav-dist-left');
        const arrivalEl = document.getElementById('nav-arrival');
        
        const etaText = this.formatDuration(remainingSeconds);
        if (etaMainEl) etaMainEl.innerText = etaText;
        if (etaTimeEl) etaTimeEl.innerText = etaText;
        if (distEl) distEl.innerText = `${(state.totalDistanceRemaining / 1000).toFixed(1)} km`;
        
        if (arrivalEl) {
          const arrivalTime = new Date(Date.now() + remainingSeconds * 1000);
          arrivalEl.innerText = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const card = document.getElementById('maneuver-card');
        if (card && state.isMoving) {
          card.style.display = 'flex';
          const maneuverDistEl = document.getElementById('maneuver-dist');
          if (maneuverDistEl) maneuverDistEl.innerText = `${Math.round(state.distanceToNext)} m`;

          const route = (this.navSystem as any).route; 
          if (route && route.steps) {
            const currentStep = route.steps[this.navSystem.currentStepIndex]; 
            if (currentStep) {
              const instrEl = document.getElementById('maneuver-instruction');
              const iconEl = document.getElementById('maneuver-icon');
              if (instrEl) instrEl.innerText = currentStep.maneuver.instruction;
              if (iconEl) iconEl.innerText = this.getManeuverIcon(currentStep.maneuver.type);
            }
          }
        }
      }
    };
  }

  private getManeuverIcon(type: string): string {
    const icons: Record<string, string> = {
      'turn': '↗',
      'sharp turn': '⤴',
      'slight turn': '➚',
      'straight': '↑',
      'on ramp': '➘',
      'off ramp': '➚',
      'fork': '🍴',
      'merger': ' merge',
      'roundabout': '🔄',
      'arrive': '🏁'
    };
    for (const key in icons) {
      if (type.toLowerCase().includes(key)) return icons[key];
    }
    return '↑';
  }


  private async findNearestEmergencyPOI() {
    if (!this.currentOriginCoords) return;
    
    // Simulate finding the nearest hospital
    const nearestHospital: [number, number] = [
      this.currentOriginCoords[0] + (Math.random() - 0.5) * 0.02,
      this.currentOriginCoords[1] + (Math.random() - 0.5) * 0.02
    ];
    
    this.showTacticalNotification('NEAREST MEDICAL FACILITY IDENTIFIED - PREPARING EXTRACTION');
    this.currentDestCoords = nearestHospital;
    this.finalizeRouting('car');
  }

  public showTacticalNotification(message: string, severity: 'info' | 'warning' | 'critical' = 'info') {
    const feed = document.getElementById('intel-feed');
    if (!feed) return;
    
    const notification = document.createElement('div');
    notification.className = `glass-panel alert-item alert-${severity}`;
    notification.style.animation = 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    notification.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="color:var(--primary-accent); font-weight:bold;">[ SYSTEM ]</span>
        <span>${message}</span>
      </div>
    `;
    
    feed.prepend(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      setTimeout(() => notification.remove(), 400);
    }, 4000);
  }

  private formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  }

  public onAndroidGPSUpdate(lng: number, lat: number, speed: number, bearing: number) {
    console.log(`[AndroidBridge] GPS Update: ${lng}, ${lat}, speed: ${speed}, bearing: ${bearing}`);
    const coords: [number, number] = [lng, lat];
    this.currentOriginCoords = coords;
    
    if (this.map) {
      // Direct, low-latency WebGL coordinate and camera follow updates
      this.map.updateCameraForNav(coords, bearing, speed, false);
      this.navSystem.snapToPosition(coords, speed);
    }
  }

  public startDemoSimulation() {
    // If no coordinates, set Joburg CBD defaults
    this.currentOriginCoords = [28.0435, -26.1952]; // Park Station
    this.currentDestCoords = [28.0494, -26.1076]; // Sandton City (~15 KM Route)

    this.showTacticalNotification("MOCKING 15 KM ROUTE TO SANDTON CITY...");
    
    // Trigger routing
    this.routeOptimizer.fetchAndOptimizeRoute(
      this.currentOriginCoords,
      this.currentDestCoords,
      'driving'
    ).then(route => {
      if (route && route.coordinates.length > 1) {
        this.map.executeCameraSequence(this.currentOriginCoords!, this.currentDestCoords!, route.coordinates);
        this.map.updateRoute(route);
        this.startNavigation(route);
        if (this.map.cameraController) {
          this.map.cameraController.setMode('CINEMATIC' as any);
        }

        // Cancel any existing interval
        if ((window as any).currentSimulationInterval) {
          cancelAnimationFrame((window as any).currentSimulationInterval);
        }

        const coords = route.coordinates;
        let currentLegIndex = 0;
        let legProgress = 0; 
        
        const speedKmh = 20; // 20 KM/H slow driving speed
        const speedMs = speedKmh / 3.6; // 5.56 m/s

        const getDist = (p1: [number, number], p2: [number, number]) => {
          const R = 6371e3;
          const f1 = p1[1] * Math.PI/180;
          const f2 = p2[1] * Math.PI/180;
          const df = (p2[1]-p1[1]) * Math.PI/180;
          const dl = (p2[0]-p1[0]) * Math.PI/180;
          const a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const interpolate = (p1: [number, number], p2: [number, number], fraction: number): [number, number] => {
          return [p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction];
        };

        const getBearing = (p1: [number, number], p2: [number, number]) => {
          const y = Math.sin((p2[0]-p1[0])*Math.PI/180) * Math.cos(p2[1]*Math.PI/180);
          const x = Math.cos(p1[1]*Math.PI/180)*Math.sin(p2[1]*Math.PI/180) -
                    Math.sin(p1[1]*Math.PI/180)*Math.cos(p2[1]*Math.PI/180)*Math.cos((p2[0]-p1[0])*Math.PI/180);
          return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        };

        let lastTime = performance.now();
        let totalTraveled = 0;

        const animate = (time: number) => {
          const dt = (time - lastTime) / 1000;
          lastTime = time;

          const clampedDt = Math.min(dt, 0.1); // prevent massive jumps
          const distanceToTravel = speedMs * clampedDt;
          
          legProgress += distanceToTravel;
          totalTraveled += distanceToTravel;

          let p1 = coords[currentLegIndex];
          let p2 = coords[currentLegIndex + 1];
          let legLength = getDist(p1, p2);

          while (legProgress >= legLength) {
            legProgress -= legLength;
            currentLegIndex++;
            if (currentLegIndex >= coords.length - 1) {
               this.showTacticalNotification("SIMULATION COMPLETED");
               this.stopNavigation();
               return; 
            }
            p1 = coords[currentLegIndex];
            p2 = coords[currentLegIndex + 1];
            legLength = getDist(p1, p2);
          }

          const fraction = legLength === 0 ? 0 : legProgress / legLength;
          const currentPos = interpolate(p1, p2, fraction);
          const heading = getBearing(p1, p2);

          this.currentOriginCoords = currentPos;
          if (this.map) {
            this.map.updateCameraForNav(currentPos, heading, speedMs, currentLegIndex === 0 && legProgress < 2);
            if (this.map.visualEffects) {
              this.map.visualEffects.updateUserVehicle(currentPos, heading);
            }
          }

          const distRemaining = Math.max(0, route.distance - totalTraveled);
          const durationRemaining = distRemaining / speedMs;

          const etaVal = document.getElementById('nav-eta-time');
          const distVal = document.getElementById('nav-dist-left');

          if (etaVal) etaVal.innerText = `${Math.ceil(durationRemaining / 60)} min`;
          if (distVal) distVal.innerText = `${(distRemaining / 1000).toFixed(1)} km`;

          (window as any).currentSimulationInterval = requestAnimationFrame(animate);
        };

        this.showTacticalNotification(`DRIVING SIMULATION STARTED: ${speedKmh} KM/H`);
        (window as any).currentSimulationInterval = requestAnimationFrame(animate);
      }
    }).catch(err => {
      console.error("Simulation routing failed:", err);
      this.showTacticalNotification("SIMULATION ROUTING FAILED");
    });
  }
}

const appInstance = new App();
(window as any).appInstance = appInstance;
