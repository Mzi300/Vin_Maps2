import { MapRenderer } from './view/mapRenderer';
import { intelligence } from './engine/intelligenceManager';
import { TRANSPORT_PROFILES } from './data/transportModes';
import type { TransportType } from './data/transportModes';
import { GeolocationService } from './engine/geolocationService';
import { RouteOptimizer } from './engine/routeOptimizer';
import type { OptimizedRoute } from './engine/routeOptimizer';
import { NavigationSystem } from './engine/navigationSystem';
import './style/index.css';
import '../frontend/reporting.js';
import { getAuthState, AuthState } from './auth';

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
  private region: string = import.meta.env.VITE_MAP_REGION || 'ZA';
  private routeOptimizer!: RouteOptimizer;
  private geoService!: GeolocationService;
  private currentOriginCoords: [number, number] | null = null;
  private currentDestCoords: [number, number] | null = null;
  private navSystem!: NavigationSystem;
  public currentTransportType: TransportType = 'car';
  private tripStartTime: number = 0;
  private tripTotalDistance: number = 0;
  private geocodingAbortController: AbortController | null = null;
  private pendingRoute: OptimizedRoute | null = null;
  private routingAbortController: AbortController | null = null;
  private authState: AuthState = getAuthState();

  constructor() {
    this.init();
  }

  private init() {
    if (!this.token) {
      console.error('Critical: Mapbox Token missing.');
      return;
    }

    const root = document.querySelector<HTMLDivElement>('#app')!;
    
    root.innerHTML = `
      <div class="scanline"></div>
      <div id="cinematic-container">
        <div id="map-container"></div>
        
        <div id="vin-cc-panel" class="vin-cc-panel">
          <div class="vin-cc-header">
            <h2 style="color:var(--primary-accent); font-size:1.2rem; margin:0; letter-spacing: 2px;">VINTECHS<span style="color:#fff;">_HUB</span></h2>
            <button id="close-cc-btn" class="menu-btn" style="padding:0;">✖</button>
          </div>
          <div class="vin-cc-content">
            <!-- Auth Zone: Step 1 (Phone) -->
            <div id="vin-auth-zone" class="vin-auth-box">
              <div style="font-size: 0.85rem; color: var(--text-dim);">SYSTEM ACCESS</div>
              <p style="font-size: 0.75rem; color: #888; margin: 0 0 0.5rem 0;">Sign in to unlock cross-device sync, AI route personalization, and stealth mode.</p>
              <input type="text" id="vin-phone-input" class="vin-input" placeholder="+27 82 000 0000" value="+27 ">
              <button id="vin-send-otp-btn" class="cat-btn" style="background: rgba(0, 242, 255, 0.1); border-color: var(--primary-accent); color: #fff; justify-content: center;">SEND SECURE OTP</button>
            </div>

            <!-- Auth Zone: Step 2 (OTP) -->
            <div id="vin-otp-zone" class="vin-auth-box" style="display: none;">
              <div style="font-size: 0.85rem; color: var(--text-dim);">VERIFY IDENTITY</div>
              <p style="font-size: 0.75rem; color: #888; margin: 0 0 0.5rem 0;">Enter the 4-digit code sent to your device.</p>
              <input type="text" id="vin-otp-input" class="vin-input" placeholder="0000" maxlength="4" style="text-align: center; font-size: 1.2rem; letter-spacing: 5px;">
              <button id="vin-verify-otp-btn" class="cat-btn" style="background: rgba(0, 242, 255, 0.1); border-color: var(--primary-accent); color: #fff; justify-content: center;">VERIFY & ACCESS</button>
              <button id="vin-back-phone-btn" class="cat-btn" style="background: transparent; border: none; color: #888; font-size: 0.8rem; justify-content: center; margin-top: -0.5rem;">← Change Number</button>
            </div>

            <!-- Logged In Dashboard (Hidden by default) -->
            <div id="vin-dashboard-zone" style="display: none; flex-direction: column; gap: 1.5rem;">
              
              <!-- AI Intelligence -->
              <div class="vin-data-card">
                <div class="vin-data-title">🧠 NAVIGATION INTELLIGENCE</div>
                <div style="background: rgba(0,242,255,0.05); padding: 0.8rem; border-radius: 6px; border: 1px solid rgba(0,242,255,0.2); margin-bottom: 0.5rem;">
                  <span style="color: #00f2ff; font-weight: bold; font-size: 0.85rem;">AI SUGGESTION</span>
                  <p style="font-size: 0.85rem; color: #ccc; margin: 0.3rem 0 0 0;">Traffic to <strong style="color:#fff;">Work</strong> is light. ETA: 22m via M1 North.</p>
                  <button class="cat-btn" style="margin-top: 0.5rem; padding: 0.4rem 0.8rem; font-size: 0.8rem;">START MISSION</button>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #888; margin-top: 0.8rem;">
                  <span>Peak Travel: 07:30 AM</span>
                  <span>Frequent: Sandton</span>
                </div>
              </div>

              <!-- Live Controls -->
              <div class="vin-data-card">
                <div class="vin-data-title">📍 PRIVACY & LOCATION</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <div>
                    <div style="color: #fff; font-size: 0.95rem;">Stealth Mode</div>
                    <div style="color: #888; font-size: 0.75rem;">Disable history & live tracking</div>
                  </div>
                  <label class="vin-toggle">
                    <input type="checkbox" id="stealth-toggle">
                    <span class="vin-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Saved Sectors -->
              <div class="vin-data-card">
                <div class="vin-data-title">⭐ SAVED SECTORS</div>
                <button class="vin-action-btn"><span>🏠 Home Base</span> <span>22m</span></button>
                <button class="vin-action-btn"><span>🏢 VinTechs HQ</span> <span>45m</span></button>
                <button class="vin-action-btn" style="color: #00f2ff; border-style: dashed; justify-content: center;">+ Add Sector</button>
              </div>

              <!-- Activity & Missions -->
              <div class="vin-data-card">
                <div class="vin-data-title">🕒 RECENT MISSIONS</div>
                <button class="vin-action-btn"><span>📍 Sector 7 Drop</span> <span>Yesterday</span></button>
                <button class="vin-action-btn"><span>📍 Waterfront</span> <span>2 days ago</span></button>
              </div>

              <!-- Contributions -->
              <div class="vin-data-card">
                <div class="vin-data-title">✍️ CONTRIBUTIONS</div>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                  <div style="flex: 1; text-align: center; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 6px;">
                    <div style="font-size: 1.2rem; color: #fff; font-weight: bold;">12</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">REPORTS</div>
                  </div>
                  <div style="flex: 1; text-align: center; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 6px;">
                    <div style="font-size: 1.2rem; color: #00f2ff; font-weight: bold;">+450</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">REP POINTS</div>
                  </div>
                </div>
              </div>
              
              <button id="vin-logout-btn" class="vin-action-btn danger" style="justify-content: center;">LOG OUT</button>

            </div>
          </div>
        </div>

        <div class="ui-overlay">
          <!-- TOP HUD: Cinematic Maneuvers -->
          <div id="maneuver-card" class="gta-hud-card maneuver-card" style="display: none;">
            <div class="maneuver-icon" id="maneuver-icon">↑</div>
            <div class="maneuver-text">
              <span id="maneuver-instruction" class="instruction-main">Follow route</span>
              <span id="maneuver-dist" class="instruction-sub">0 m</span>
            </div>
          </div>

          <div class="top-controls">
            <div id="routing-engine" class="gta-hud-card command-bar search-state">
              <div id="search-view" class="search-section">
                <div class="input-group" style="width: 100%;">
                  <button id="open-sidebar" class="menu-btn" style="margin-right: 5px;">☰</button>
                  <input type="text" class="search-input" placeholder="Search South Africa..." id="dest-input" autocomplete="off" style="flex: 1;">
                  <button id="locate-me" class="menu-btn" style="font-size: 1.1rem; padding: 0 5px;" title="My Location">📍</button>
                  <button id="historical-traffic-btn" class="cat-btn" style="background: rgba(0, 242, 255, 0.1); border-color: var(--primary-accent); color: #fff; margin-left: 5px;">📊 Historical Traffic</button>
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
                        <span class="tab-time">${Math.floor(Math.random() * 30 + 5)}m</span>
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

                <!-- Route Conditions Preview (Hidden initially) -->
                <div id="route-preview-panel" style="display: none; width: 100%; margin-top: 1rem; flex-direction: column; gap: 0.5rem; background: rgba(0, 0, 0, 0.4); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: var(--text-main);">Route Condition</span>
                    <span id="route-condition-status" style="font-weight: bold; color: #00f2ff;">SCANNING...</span>
                  </div>
                  <p id="route-condition-details" style="font-size: 0.85rem; color: var(--text-dim); margin: 0;">Analyzing route for hazards, traffic, and weather conditions...</p>
                  
                  <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                    <div style="flex: 1; text-align: center; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 6px;">
                      <div style="font-size: 0.75rem; color: var(--text-dim);">EST. TIME</div>
                      <div id="preview-eta" style="font-weight: bold; font-size: 1.1rem;">--</div>
                    </div>
                    <div style="flex: 1; text-align: center; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 6px;">
                      <div style="font-size: 0.75rem; color: var(--text-dim);">DISTANCE</div>
                      <div id="preview-distance" style="font-weight: bold; font-size: 1.1rem;">--</div>
                    </div>
                  </div>
                  
                  <button id="start-navigation-btn" class="cat-btn" style="width: 100%; margin-top: 0.5rem; background: rgba(0, 242, 255, 0.2); border-color: #00f2ff; color: #00f2ff; padding: 0.8rem; font-weight: bold; letter-spacing: 1px;">START NAVIGATION</button>
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
                  <div class="dropdown-section scrollable-dropdown">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <label>VIMAPS INTEL</label>
                      <button id="close-poi-dropdown" class="cat-btn" style="padding: 2px 8px; font-size: 0.8rem; margin-bottom: 5px; background: transparent; border: none; color: var(--text-dim);">✖</button>
                    </div>
                    <button class="cat-btn" data-poi="hospital">🏥 Hospitals</button>
                    <button class="cat-btn" data-poi="police">🛡️ Security</button>
                    <button class="cat-btn" data-poi="bank">🏦 Financial</button>
                    <button class="cat-btn" data-poi="fuel">⛽ Fuel</button>
                    <button class="cat-btn" data-poi="hotel">🏨 Lodging</button>
                    <button class="cat-btn" data-poi="food">🍽️ Food & Restaurants</button>
                    <button class="cat-btn" data-poi="shopping">🛒 Shopping & Retail</button>
                    <button class="cat-btn" data-poi="vehicle">🚗 Vehicle Services</button>
                    <button class="cat-btn" data-poi="parking">🅿️ Parking</button>
                    <button class="cat-btn" data-poi="transport">🚌 Transport</button>
                    <button class="cat-btn" data-poi="utilities">⚡ Utilities</button>
                    <button class="cat-btn" data-poi="road_conditions">🚧 Road Conditions</button>
                    <button class="cat-btn" data-poi="weather">🌦️ Weather & Hazards</button>
                    <button class="cat-btn" data-poi="education">🎓 Education</button>
                    <button class="cat-btn" data-poi="poi">🎯 Points of Interest</button>
                  </div>
                </div>
              </div>

              <div id="nav-bottom-bar" class="nav-bar-minimal glass-panel" style="display: none;">
                <div class="nav-info-group">
                  <span id="nav-eta-time" class="nav-main-eta">CALCULATING...</span>
                  <div class="nav-sub-info">
                    <span id="nav-distance">0.0 km</span> • <span id="nav-arrival">--:--</span>
                  </div>
                </div>
                <button id="exit-nav" class="exit-nav-btn">EXIT NAV</button>
              </div>
            </div>
          </div>

          <!-- Floating Controls -->
          <div class="floating-controls">
            <button id="recenter-btn" class="gta-hud-circle recenter-btn" style="display: none;" title="Re-center">🎯</button>
            <button id="perspective-toggle" class="gta-hud-circle perspective-toggle-btn" style="display: none;" title="Toggle 2D/3D">2D</button>
            <button id="weather-toggle" class="gta-hud-circle weather-toggle-btn" title="Toggle Weather">⛅</button>
          </div>

          <!-- INTEL DISCOVERY RESULTS PANEL -->
          <div id="intel-results-container" class="intel-results-panel" style="display: none;">
             <!-- Cards injected here -->
          </div>

          <!-- Hazard Reporting FAB -->
          <div id="hazard-fab" class="hazard-fab" style="display: none;">
            <button class="hazard-btn pothole" onclick="app.reportHazard('pothole')">🕳️</button>
            <button class="hazard-btn accident" onclick="app.reportHazard('accident')">💥</button>
            <button class="hazard-btn roadblock" onclick="app.reportHazard('roadblock')">🚧</button>
            <button class="hazard-btn weather" onclick="app.reportHazard('weather')">🌪️</button>
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
            <h1 class="loader-title">VIMAPS SYSTEM</h1>
            <p class="loader-status" id="loader-status">Initializing tactical link...</p>
          </div>
        </div>
      </div>
    
    `;

    // Register Service Worker for offline map tile caching
    if ('serviceWorker' in navigator && import.meta.env.VITE_OFFLINE_CACHE !== 'false') {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
    }

    this.map = new MapRenderer('map-container', this.token!);
    (window as any).app = this;
    (window as any).appMap = this.map;
    
    // Lazy load heavy navigation engines to prioritize fast map rendering
    requestIdleCallback(() => {
      this.routeOptimizer = new RouteOptimizer(this.token!);
      this.navSystem = new NavigationSystem();
      this.routeOptimizer.prewarmRouting();
    });
    
    this.map.map.on('load', () => {
      this.geoService = new GeolocationService(this.map.map);
      const loader = document.getElementById('startup-loader');
      const loaderStatus = document.getElementById('loader-status');
      
      if (loaderStatus) loaderStatus.innerText = 'WAITING FOR TACTICAL GPS LOCK...';
      
      // Show map immediately
      const mapCanvas = this.map.map.getCanvas();
      if (mapCanvas) mapCanvas.style.opacity = '1';

      this.geoService.initializeLocation((coords: [number, number]) => {
        this.currentOriginCoords = coords;
        
        // INSTANT SNAP TO REAL GPS
        this.map.map.jumpTo({
          center: coords,
          zoom: 18.5,
          pitch: 70
        });
        
        // Show map now that we are at the right place
        const mapCanvas = this.map.map.getCanvas();
        if (mapCanvas) mapCanvas.style.opacity = '1';
        
        // Use DRIVING mode instantly to lock the camera securely to the GPS location
        this.map.enterNavigationMode();

        this.map.map.on('click', async (e: any) => {
          const lng = e.lngLat?.lng ?? e.point?.x;
          const lat = e.lngLat?.lat ?? e.point?.y;
          const lngInput = document.getElementById('report-lng') as HTMLInputElement;
          const latInput = document.getElementById('report-lat') as HTMLInputElement;
          if (lngInput) lngInput.value = lng?.toFixed(6) ?? '';
          if (latInput) latInput.value = lat?.toFixed(6) ?? '';
          // Reverse geocode and display in intel panel
          try {
            const address = await this.geoService.reverseGeocode([lng, lat]);
            this.showIntel(address);
          } catch (e) {
            console.error('Reverse geocode UI error', e);
          }
        });

        // Update camera controller with initial position
        if (this.map.cameraController) {
          // Force current state to match the GPS snap
          (this.map.cameraController as any).current.zoom = 18.5;
          (this.map.cameraController as any).current.pitch = 68;
          this.map.cameraController.update(coords, 0, 0, true);
        }
        
        // Set origin input to 'Current Location'
        const originInput = document.getElementById('origin-input') as HTMLInputElement;
        if (originInput) originInput.value = 'Current Location';
        
        // Force the icon to show at the start
        if (this.map.visualEffects) {
          this.map.visualEffects.updateUserVehicle(coords, 0);
          this.map.visualEffects.updateUserLocationGlow(coords);
        }

        // Ensure engines are initialized if GPS locked faster than requestIdleCallback
        if (!this.navSystem) {
          this.navSystem = new NavigationSystem();
          this.routeOptimizer = new RouteOptimizer(this.token!);
          this.routeOptimizer.prewarmRouting();
        }

        this.navSystem.snapToPosition(coords, 0);
        this.navSystem.startTracking();
        this.setupNavigationStateListener();

        if (loader) {
          loader.classList.add('hidden');
          setTimeout(() => loader.remove(), 800);
        }
      });
      
      this.loadMajorCities();
    });

    this.setupListeners();
    this.updateAuthUI();
  }

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  private loadMajorCities() {
    const SA_MAJOR_CITIES = [
      { name: 'Johannesburg', coords: [28.0473, -26.2041] },
      { name: 'Cape Town', coords: [18.4241, -33.9249] },
      { name: 'Durban', coords: [31.0218, -29.8587] },
      { name: 'Pretoria', coords: [28.1881, -25.7479] },
      { name: 'Port Elizabeth', coords: [25.6022, -33.9608] },
      { name: 'Bloemfontein', coords: [26.2140, -29.1146] },
      { name: 'Nelspruit', coords: [30.9852, -25.4753] },
      { name: 'Polokwane', coords: [29.4688, -23.8962] },
      { name: 'Kimberley', coords: [24.7623, -28.7282] }
    ];

    SA_MAJOR_CITIES.forEach((city, index) => {
      this.map.addTacticalMarker({
        id: `city-${index}`,
        type: 'Urban Node',
        location: city.coords,
        severity: 'info',
        message: city.name,
        timestamp: Date.now()
      });
    });
  }

  private setupListeners() {
    const destInput = document.getElementById('dest-input') as HTMLInputElement;
    const originInput = document.getElementById('origin-input') as HTMLInputElement;

    // Handle Search Inputs (Instant feedback)
    destInput?.addEventListener('input', this.debounce(() => {
      this.handleGeocoding(destInput.value, 'destination');
    }, 50));

    originInput?.addEventListener('input', this.debounce(() => {
      this.handleGeocoding(originInput.value, 'origin');
    }, 50));

    // POI Search on Enter key
    destInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handlePOISearch(destInput.value);
      }
    });

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

    // VinTech Control Center
    const ccPanel = document.getElementById('vin-cc-panel');
    document.getElementById('open-sidebar')?.addEventListener('click', () => ccPanel?.classList.add('open'));
    document.getElementById('close-cc-btn')?.addEventListener('click', () => ccPanel?.classList.remove('open'));

    // Authentication Logic (OTP Flow)
    const phoneInput = document.getElementById('vin-phone-input') as HTMLInputElement;
    const otpInput = document.getElementById('vin-otp-input') as HTMLInputElement;
    const authZone = document.getElementById('vin-auth-zone')!;
    const otpZone = document.getElementById('vin-otp-zone')!;
    const dashboardZone = document.getElementById('vin-dashboard-zone')!;
    const sendOtpBtn = document.getElementById('vin-send-otp-btn') as HTMLButtonElement;

    sendOtpBtn?.addEventListener('click', () => {
      const phone = phoneInput.value.replace(/\s+/g, '');
      if (phone.startsWith('+27') && phone.length === 12) { // +27 + 9 digits
        sendOtpBtn.innerText = 'SENDING...';
        
        // Simulate network delay
        setTimeout(() => {
          authZone.style.display = 'none';
          otpZone.style.display = 'flex';
          this.showTacticalNotification(`OTP SENT TO ${phone}`);
          sendOtpBtn.innerText = 'SEND SECURE OTP';
        }, 1000);
      } else {
        this.showTacticalNotification('INVALID SA NUMBER. MUST BE +27 FOLLOWED BY 9 DIGITS.');
      }
    });

    document.getElementById('vin-back-phone-btn')?.addEventListener('click', () => {
      otpZone.style.display = 'none';
      authZone.style.display = 'flex';
      otpInput.value = '';
    });

    document.getElementById('vin-verify-otp-btn')?.addEventListener('click', () => {
      if (otpInput.value.length === 4) {
        otpZone.style.display = 'none';
        dashboardZone.style.display = 'flex';
        this.showTacticalNotification('VINTECH ID AUTHENTICATED');
      } else {
        this.showTacticalNotification('INVALID OTP. PLEASE ENTER 4 DIGITS.');
      }
    });

    document.getElementById('vin-logout-btn')?.addEventListener('click', () => {
      dashboardZone.style.display = 'none';
      authZone.style.display = 'flex';
      phoneInput.value = '+27 ';
      otpInput.value = '';
      this.showTacticalNotification('LOGGED OUT. CACHE CLEARED.');
    });

    document.getElementById('stealth-toggle')?.addEventListener('change', (e) => {
      const isStealth = (e.target as HTMLInputElement).checked;
      if (isStealth) {
        this.showTacticalNotification('STEALTH MODE ENGAGED. LIVE TRACKING OFF.');
      } else {
        this.showTacticalNotification('LIVE LOCATION SHARING ACTIVE.');
      }
    });

    document.querySelectorAll('.vin-action-btn').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        if (target.id !== 'vin-logout-btn') {
          ccPanel?.classList.remove('open');
          if (target.innerText.includes('Home Base')) {
            this.map.flyTo(28.0473, -26.2041, 15);
            this.showTacticalNotification('ROUTING TO HOME BASE');
          } else if (target.innerText.includes('Sector 7')) {
            this.showTacticalNotification('REPLAYING SECTOR 7 MISSION');
          } else if (target.innerText.includes('Add Sector')) {
            this.showTacticalNotification('SCANNING FOR NEW SECTORS');
          }
        }
      });
    });

    // Directions Toggle
    document.getElementById('lock-dest')?.addEventListener('click', () => {
      if (this.currentDestCoords) this.advanceToTransportStep();
    });

    document.getElementById('close-directions')?.addEventListener('click', () => {
      document.getElementById('directions-view')!.style.display = 'none';
      document.getElementById('search-view')!.style.display = 'flex';
      this.map.exitNavigationMode();
    });

    // GPS Buttons
    document.getElementById('locate-me')?.addEventListener('click', () => {
      if (this.currentOriginCoords) {
        this.map.flyTo(this.currentOriginCoords[0], this.currentOriginCoords[1]);
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
    document.getElementById('recenter-btn')?.addEventListener('click', () => this.map.recenter());

    // Perspective Toggle
    let is2D = false;
    const perspectiveToggle = document.getElementById('perspective-toggle');
    perspectiveToggle?.addEventListener('click', () => {
      is2D = !is2D;
      if (is2D) {
        this.map.cameraController?.setMode('DRIVING_2D' as any);
        if (perspectiveToggle) perspectiveToggle.innerText = '3D';
        this.showTacticalNotification('SWITCHED TO 2D MODE');
      } else {
        this.map.cameraController?.setMode('DRIVING' as any);
        if (perspectiveToggle) perspectiveToggle.innerText = '2D';
        this.showTacticalNotification('SWITCHED TO 3D MODE');
      }
    });

    // Weather
    document.getElementById('weather-toggle')?.addEventListener('click', () => {
      if (this.map.visualEffects) this.map.visualEffects.toggleWeather();
    });

    document.getElementById('start-navigation-btn')?.addEventListener('click', () => {
      if (this.pendingRoute) {
        document.getElementById('route-preview-panel')!.style.display = 'none';
        this.map.executeCameraSequence(this.currentOriginCoords!, this.currentDestCoords!, this.pendingRoute.coordinates);
        this.startNavigation(this.pendingRoute);
      }
    });

    // POI Dropdown
    const dropdownToggle = document.getElementById('poi-dropdown-toggle');
    const dropdownMenu = document.getElementById('poi-dropdown-menu');

    dropdownToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle('active');
      dropdownToggle.classList.toggle('active');
    });

    // Explicit Close Button
    document.getElementById('close-poi-dropdown')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.remove('active');
      dropdownToggle?.classList.remove('active');
    });

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
  }

  private async handleGeocoding(query: string, mode: 'origin' | 'destination') {
    if (!query || query.length < 2) {
       const list = mode === 'destination' ? document.getElementById('suggestions-list') : document.getElementById('origin-suggestions');
       if (list) list.style.display = 'none';
       return;
    }
    
    if (this.geocodingAbortController) this.geocodingAbortController.abort();
    this.geocodingAbortController = new AbortController();

    try {
      const proximity = this.currentOriginCoords ? `&proximity=${this.currentOriginCoords[0]},${this.currentOriginCoords[1]}` : '';
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}${proximity}&autocomplete=true&limit=10&country=${this.region}`;
      
      const res = await fetch(url, { signal: this.geocodingAbortController.signal });
      const data = await res.json();
      this.displaySuggestions(data.features || [], mode);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Geocoding fail:', e);
    }
  }

  private displaySuggestions(features: any[], mode: 'origin' | 'destination') {
    const list = mode === 'destination' ? document.getElementById('suggestions-list') : document.getElementById('origin-suggestions');
    if (!list) return;

    let html = `
      <div style="display: flex; justify-content: flex-end; padding-bottom: 5px; margin-bottom: 5px; border-bottom: 1px solid var(--glass-border);">
        <button class="cat-btn close-suggestions-btn" style="padding: 2px 8px; font-size: 0.8rem; background: transparent; border: none; color: var(--text-dim); cursor: pointer;">✖</button>
      </div>
    `;

    html += features.map(f => `
      <div class="suggestion-item" data-lng="${f.center[0]}" data-lat="${f.center[1]}" data-text="${f.text}">
        <div class="sugg-main">${f.text}</div>
        <div class="sugg-sub">${f.place_name}</div>
      </div>
    `).join('');
    
    list.innerHTML = html;
    list.style.display = features.length > 0 ? 'block' : 'none';

    list.querySelector('.close-suggestions-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      list.style.display = 'none';
    });

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
    
    // Clear active state from any previously selected transport tab
    document.querySelectorAll('.transport-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('route-preview-panel')!.style.display = 'none';
    
    const reasoning = document.getElementById('loader-status');
    if (reasoning) reasoning.innerText = `AI Assistant: Awaiting transport mode selection.`;
  }

    // ---------- POI & Intel UI Helpers ----------
    private async handlePOISearch(query: string) {
      if (!query) return;
      try {
        const results = await this.geoService.searchPOI(query);
        if (!results || results.length === 0) {
          this.showIntel('No POI results found.');
          return;
        }
        const cards = results.map(r => this.renderPOICard(r)).join('');
        this.showIntel(cards);
      } catch (e) {
        console.error('POI search error', e);
        this.showIntel('Error searching POI.');
      }
    }

    private renderPOICard(feature: any): string {
      const title = feature.text || 'POI';
      const address = feature.place_name || '';
      const distance = feature.distance ? `${Math.round(feature.distance)} m` : '';
      return `
        <div class="intel-card">
          <div class="intel-card-header">
            <span class="intel-card-title">${title}</span>
            <div class="intel-close-panel-btn" onclick="document.getElementById('intel-results-container').style.display='none'">✖</div>
          </div>
          <div class="intel-card-content">
            <div>${address}</div>
            ${distance ? `<div class="intel-card-stats"><span class="intel-card-stat">${distance}</span></div>` : ''}
          </div>
        </div>`;
    }

    private showIntel(content: string) {
      const container = document.getElementById('intel-results-container');
      if (!container) return;
      container.style.display = 'block';
      container.innerHTML = content;
    }


    private async handlePOISearch(query: string) {
      if (!query) return;
      try {
        const results = await this.geoService.searchPOI(query);
        if (!results || results.length === 0) {
          this.showIntel('No POI results found.');
          return;
        }
        const cards = results.map(r => this.renderPOICard(r)).join('');
        this.showIntel(cards);
      } catch (e) {
        console.error('POI search error', e);
        this.showIntel('Error searching POI.');
      }
    }


      const title = feature.text || 'POI';
      const address = feature.place_name || '';
      const distance = feature.distance ? `${Math.round(feature.distance)} m` : '';
      return `
        <div class="intel-card">
          <div class="intel-card-header">
            <span class="intel-card-title">${title}</span>
            <div class="intel-close-panel-btn" onclick="document.getElementById('intel-results-container').style.display='none'">✖</div>
          </div>
          <div class="intel-card-content">
            <div>${address}</div>
            ${distance ? `<div class="intel-card-stats"><span class="intel-card-stat">${distance}</span></div>` : ''}
          </div>
        </div>`;
    }

    private showIntel(content: string) {
      const container = document.getElementById('intel-results-container');
      if (!container) return;
      container.style.display = 'block';
      container.innerHTML = content;
    }

  private simulateRouteCondition(route: OptimizedRoute) {
    const conditions = [
      { status: 'CLEAR', color: '#00ff88', details: 'Route is clear. Optimal traffic flow.' },
      { status: 'ROADWORKS', color: '#ffcc00', details: 'Minor delays due to active road maintenance ahead.' },
      { status: 'ACCIDENT', color: '#ff3333', details: 'Collision detected on route. Traffic is building up.' },
      { status: 'HEAVY TRAFFIC', color: '#ff9900', details: 'High volume of vehicles. Expect slower speeds.' },
      { status: 'POOR WEATHER', color: '#00ccff', details: 'Wet conditions. Reduce speed and maintain following distance.' }
    ];
    
    // Use a mix of randomness and route data to pick a condition
    // For very short routes, mostly clear
    if (route.distance < 2000 && Math.random() > 0.2) return conditions[0];
    
    const randomIdx = Math.floor(Math.random() * conditions.length);
    return conditions[randomIdx];
  }

  public async finalizeRouting(type: TransportType) {
    if (!this.currentOriginCoords || !this.currentDestCoords) return;

    if (this.routingAbortController) this.routingAbortController.abort();
    this.routingAbortController = new AbortController();

    const profile = TRANSPORT_PROFILES[type].mapboxProfile;
    
    try {
      const reasoning = document.getElementById('loader-status');
      if (reasoning) reasoning.innerText = `AI Assistant: Analyzing route conditions...`;
      this.map.cameraController?.lockCamera();

      const route = await this.routeOptimizer.fetchAndOptimizeRoute(
        this.currentOriginCoords,
        this.currentDestCoords,
        profile,
        this.routingAbortController.signal
      );

      // Request dynamic traffic speed factor for the route
      let speedFactor = 1.0;
      try {
        const trafficResp = await fetch(`/api/traffic/flow?coords=${encodeURIComponent(JSON.stringify(route.coordinates))}`);
        if (trafficResp.ok) {
          const trafficData = await trafficResp.json();
          speedFactor = trafficData.speedFactor ?? 1.0;
        }
      } catch (e) {
        console.warn('Failed to fetch dynamic traffic factor', e);
      }
      // Store for ETA calculations
      (this as any).speedFactor = speedFactor;

      if (route && (window as any).renderTurnPanel) {
        (window as any).renderTurnPanel(route.steps || []);
      }
      // Speak first instruction using voice guide if available
      if (route && route.steps && route.steps.length > 0 && (window as any).speakInstruction) {
        (window as any).speakInstruction(route.steps[0].instruction || 'Proceed');
      }

      if (route) {
        this.pendingRoute = route;
        
        // PRE-INIT HUD: Show data before motion starts
        const etaEl = document.getElementById('nav-eta-time');
        const distEl = document.getElementById('nav-distance');
        const arrivalEl = document.getElementById('nav-arrival');
        if (etaEl) etaEl.innerText = this.formatDuration(route.duration);
        if (distEl) distEl.innerText = `${(route.distance / 1000).toFixed(1)} km`;
        if (arrivalEl) {
          const arrivalTime = new Date(Date.now() + route.duration * 1000);
          arrivalEl.innerText = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // SHOW PREVIEW UI
        const condition = this.simulateRouteCondition(route);
        const statusEl = document.getElementById('route-condition-status');
        const detailsEl = document.getElementById('route-condition-details');
        if (statusEl) {
          statusEl.innerText = condition.status;
          statusEl.style.color = condition.color;
        }
        if (detailsEl) detailsEl.innerText = condition.details;

        document.getElementById('preview-eta')!.innerText = this.formatDuration(route.duration);
        document.getElementById('preview-distance')!.innerText = `${(route.distance / 1000).toFixed(1)} km`;
        
        document.getElementById('route-preview-panel')!.style.display = 'flex';
        if (reasoning) reasoning.innerText = `AI Assistant: Route analyzed. Awaiting confirmation.`;
        
        // Draw the route on map in OVERVIEW mode
        if (this.map.visualEffects) this.map.visualEffects.drawGlowingRoute(this.currentOriginCoords!, this.currentDestCoords!, route.coordinates);
        if (this.map.cameraController) this.map.cameraController.setMode('OVERVIEW' as any);
this.map.cameraController?.unlockCamera();
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Routing fail:', e);
    }
  }

  private startNavigation(route: OptimizedRoute) {
    this.tripStartTime = Date.now();
    this.tripTotalDistance = route.distance;
    
    this.navSystem.start(route, TRANSPORT_PROFILES[this.currentTransportType].mapboxProfile);
    
    document.getElementById('maneuver-card')!.style.display = 'flex';
      // Hook step change for UI update
      if ((window as any).updateTurnPanel) {
      this.navSystem.onStepChange = (_: any) => {
          const steps = this.pendingRoute?.steps || [];
          (window as any).updateTurnPanel(steps, this.navSystem.currentStepIndex);
        };
      }
    document.getElementById('nav-bottom-bar')!.style.display = 'flex';
    document.getElementById('recenter-btn')!.style.display = 'flex';
    document.getElementById('perspective-toggle')!.style.display = 'flex';
    
    // HIDE TOP UI: Remove search/directions during active nav
    const topControls = document.querySelector('.top-controls') as HTMLElement;
    if (topControls) topControls.style.display = 'none';
    
    if (this.map.visualEffects) {
      this.map.visualEffects.setNavigating(true);
    }
    
    // Ensure Intel dropdown remains accessible
    // Zoom in and focus on route when navigation begins
    if (this.map && this.map.map) {
      // Ensure driving mode for proper camera presets
      if (this.map.cameraController) this.map.cameraController.setMode('DRIVING' as any);
      this.map.map.easeTo({
        zoom: 16.5, // closer view
        pitch: 68,  // maintain 3D perspective
        bearing: this.map.map.getBearing(),
        duration: 1200,
      });
    }

    
    const briefing = intelligence.generateTacticalBriefing(route, this.currentTransportType);
    this.showTacticalNotification(briefing.brief);
    this.speakBriefing(briefing.brief);
    

    
    this.navSystem.onOffRoute = () => {
      this.speakBriefing("Recalculating route.");
      this.finalizeRouting(this.currentTransportType);
    };
  }



  private stopNavigation() {
    this.navSystem.stop();
    this.map.exitNavigationMode();
    this.map.visualEffects.clearRoute();
    
    document.getElementById('search-view')!.style.display = 'flex';
    document.getElementById('nav-bottom-bar')!.style.display = 'none';
    document.getElementById('recenter-btn')!.style.display = 'none';
    const perspectiveToggle = document.getElementById('perspective-toggle');
    if (perspectiveToggle) {
        perspectiveToggle.style.display = 'none';
        perspectiveToggle.innerText = '2D';
    }
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



// Authentication UI updater
private updateAuthUI() {
    const badge = document.getElementById('guest-badge');
    const loginBtn = document.getElementById('login-btn');
    if (this.authState === AuthState.Authenticated) {
      if (badge) badge.style.display = 'none';
      if (loginBtn) loginBtn.innerText = '👤 Logout';
    } else {
      if (badge) badge.style.display = 'block';
      if (loginBtn) loginBtn.innerText = '👤 Login / Sign In';
    }
  }

  private setupNavigationStateListener() {
    this.navSystem.onUpdate = (state) => {
      const { min, max } = this.navSystem.getZoomRange();
      this.map.updateCameraForNav(state.currentPosition, state.heading, state.speed, min, max);

      if (this.map.visualEffects) {
        this.map.visualEffects.updateUserVehicle(state.currentPosition, state.heading);
        this.map.visualEffects.updateDestMarkerVisibility(state.totalDistanceRemaining);
      }

      const navBottomBar = document.getElementById('nav-bottom-bar');
      if (navBottomBar && navBottomBar.style.display === 'flex') {
        const speedMs = state.speed > 1 ? state.speed : 13.8; 
        const remainingSeconds = state.totalDistanceRemaining / speedMs;
        
        const etaEl = document.getElementById('nav-eta-time');
        const distEl = document.getElementById('nav-distance');
        const arrivalEl = document.getElementById('nav-arrival');
        
        if (etaEl) etaEl.innerText = this.formatDuration(remainingSeconds);
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

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      hospital: '🏥',
      police: '🛡️',
      bank: '🏦',
      fuel: '⛽',
      hotel: '🏨',
      food: '🍽️',
      shopping: '🛒',
      vehicle: '🚗',
      parking: '🅿️',
      transport: '🚌',
      utilities: '⚡',
      road_conditions: '🚧',
      weather: '🌦️',
      education: '🎓',
      poi: '🎯'
    };
    return icons[category.toLowerCase()] || '📍';
  }

  private getOverpassQuery(category: string): string {
    const map: Record<string, string> = {
      hospital: 'amenity~"hospital|clinic"',
      police: 'amenity=police',
      bank: 'amenity=bank',
      fuel: 'amenity=fuel',
      hotel: 'tourism=hotel',
      food: 'amenity~"restaurant|fast_food|cafe"',
      shopping: 'shop~"supermarket|mall|convenience|pharmacy"',
      vehicle: 'shop~"car_repair|tyres"',
      parking: 'amenity=parking',
      transport: 'amenity~"taxi|bus_station"',
      utilities: 'amenity~"atm|charging_station"',
      education: 'amenity~"school|college|university"',
      poi: 'tourism~"attraction|museum"'
    };
    return map[category.toLowerCase()] || `name~"${category}"`;
  }

  private calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
  }

  private async filterUrbanIntelligence(category: string) {
    const center = this.map.map.getCenter();
    const origin: [number, number] = this.currentOriginCoords || [center.lng, center.lat];
    
    const statusText = document.getElementById('loader-status');
    const startupLoader = document.getElementById('startup-loader');
    if (startupLoader && statusText) {
      startupLoader.style.display = 'flex';
      startupLoader.style.background = 'rgba(0,0,0,0.4)';
      statusText.innerText = `SCANNING SECTOR FOR: ${category.toUpperCase()}...`;
    }

    try {
      // IMMEDIATE UI FEEDBACK: Show skeleton cards instantly!
      const container = document.getElementById('intel-results-container');
      if (container) {
        let skeletonHtml = `
          <div class="intel-close-panel-btn" onclick="document.getElementById('intel-results-container').style.display='none'">✖</div>
        `;
        for (let i = 0; i < 3; i++) {
          skeletonHtml += `
            <div class="intel-card" style="border-color: var(--glass-border); opacity: 0.7;">
              <div class="intel-card-header">
                <div style="display:flex; align-items:center; gap:5px;">
                  <div class="intel-card-title" style="color:var(--primary-accent); animation: pulse 1.5s infinite;">Scanning for ${category}...</div>
                </div>
                <div class="intel-card-icon">📡</div>
              </div>
              <div style="font-size: 0.75rem; color: #a0a0a0;">Acquiring signal...</div>
              <div class="intel-card-stats">
                <div class="intel-card-stat">📍 -- km</div>
                <div class="intel-card-stat">⏱️ -- min</div>
              </div>
            </div>
          `;
        }
        container.innerHTML = skeletonHtml;
        container.style.display = 'flex';
      }

      // Now fetch from Overpass API in the background
      const overpassTag = this.getOverpassQuery(category);
      const query = `[out:json][timeout:5];(node(around:2500,${origin[1]},${origin[0]})[${overpassTag}];way(around:2500,${origin[1]},${origin[0]})[${overpassTag}];);out center;`;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: 'data=' + encodeURIComponent(query)
      });

      if (!response.ok) throw new Error(`POI Server overloaded`);
      
      const textData = await response.text();
      const data = JSON.parse(textData);
      
      let validFeatures = (data.elements || [])
        .filter((e: any) => e.tags && e.tags.name)
        .map((e: any) => {
          const lat = e.center?.lat || e.lat;
          const lon = e.center?.lon || e.lon;
          const street = e.tags['addr:street'] || '';
          const city = e.tags['addr:city'] || '';
          let place_name = e.tags.name;
          if (street && city) place_name += `, ${street}, ${city}`;
          else if (street) place_name += `, ${street}`;
          
          return {
            id: e.id || Math.random().toString(),
            text: e.tags.name,
            place_name: place_name,
            center: [lon, lat]
          };
        });

      if (validFeatures.length > 0) {
        if (startupLoader && statusText) {
          statusText.innerText = `CALCULATING FASTEST ROUTE...`;
        }

        // Sort by straight-line distance first
        const sorted = validFeatures.map((f: any) => {
          const [lng, lat] = f.center;
          const distKm = this.calculateDistanceKM(origin[1], origin[0], lat, lng);
          return { ...f, distKm, etaMins: Math.max(1, Math.round((distKm / 40) * 60)) };
        }).sort((a: any, b: any) => a.distKm - b.distKm).slice(0, 3);

        // Define rendering function to update UI instantly and later
        const renderUI = (fastestIdx: number) => {
          const container = document.getElementById('intel-results-container');
          if (!container) return;

          let html = `
            <div class="intel-close-panel-btn" onclick="document.getElementById('intel-results-container').style.display='none'">✖</div>
          `;

          sorted.forEach((feature: any, index: number) => {
            const [lng, lat] = feature.center;
            const isWinner = (index === fastestIdx);
            const badge = isWinner ? `<div style="background:var(--success); color:#000; font-size:0.6rem; padding:2px 5px; border-radius:4px; font-weight:bold;">FASTEST</div>` : '';
            const borderColor = isWinner ? 'var(--success)' : 'var(--primary-accent)';
            
            if (!feature.markerAdded) {
              this.map.addTacticalMarker({
                id: `intel-${category}-${index}`,
                type: 'Urban Node',
                location: [lng, lat],
                severity: isWinner ? 'warning' : 'info', // Highlighting winner
                message: feature.text,
                timestamp: Date.now()
              });
              feature.markerAdded = true;
            }

            html += `
              <div class="intel-card" style="border-color: ${borderColor};">
                <div class="intel-card-header">
                  <div style="display:flex; align-items:center; gap:5px;">
                    <div class="intel-card-title">${feature.text}</div>
                    ${badge}
                  </div>
                  <div class="intel-card-icon">${this.getCategoryIcon(category)}</div>
                </div>
                <div style="font-size: 0.75rem; color: #a0a0a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${feature.place_name.split(',')[0]}
                </div>
                <div class="intel-card-stats">
                  <div class="intel-card-stat">📍 ${feature.distKm.toFixed(1)} km</div>
                  <div class="intel-card-stat">⏱️ ~${feature.etaMins} min</div>
                </div>
                <div class="intel-card-actions" style="display:flex; flex-direction:column; gap:5px;">
                  <button class="intel-nav-btn" ${isWinner ? 'style="background: var(--success); color:#000;"' : ''} onclick="window.startIntelNavigation(${lng}, ${lat}, '${feature.text.replace(/'/g, "\\'")}')">
                    NAVIGATE
                  </button>
                  <div style="display:flex; gap:5px; margin-top:3px;">
                    <button class="cat-btn" style="flex:1; padding:4px 0; font-size:0.75rem; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); color:#fff;" onclick="alert('Destination Saved to profile!')">💾 Save</button>
                    <button class="cat-btn" style="flex:1; padding:4px 0; font-size:0.75rem; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); color:#fff;" onclick="alert('Share link copied!')">🔗 Share</button>
                    <button class="cat-btn" style="flex:1; padding:4px 0; font-size:0.75rem; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); color:#fff;" onclick="alert('More Information loading...')">ℹ️ Info</button>
                  </div>
                </div>
              </div>
            `;
          });

          container.innerHTML = html;
          container.style.display = 'flex';
        };

        // Render immediately with straight-line estimates
        renderUI(0);
        
        if (startupLoader) {
          startupLoader.style.display = 'none';
        }
        
        this.showTacticalNotification(`FOUND ${sorted.length} LOCATIONS. REFINING ROUTES...`);

        // Now do background route optimization
        const candidates = sorted.slice(0, 3);
        const routePromises = candidates.map(async (feature: any) => {
          try {
            const dest: [number, number] = feature.center;
            // Provide a dummy abort signal for this check
            const route = await this.routeOptimizer.fetchAndOptimizeRoute(origin, dest, 'driving-traffic', new AbortController().signal);
            return { feature, route };
          } catch (e) {
            return { feature, route: null };
          }
        });

        // Run mapbox lookups without blocking UI thread
        Promise.all(routePromises).then(routeResults => {
          let fastestIndex = 0;
          let shortestDuration = Infinity;

          routeResults.forEach((res, i) => {
            if (res.route && res.route.duration < shortestDuration) {
              shortestDuration = res.route.duration;
              fastestIndex = i;
            }
            // Attach exact data back to the sorted array
            const originalIndex = sorted.findIndex((f: any) => f.id === res.feature.id);
            if (originalIndex !== -1) {
              sorted[originalIndex].exactRoute = res.route;
              if (res.route) {
                 sorted[originalIndex].distKm = res.route.distance / 1000;
                 sorted[originalIndex].etaMins = Math.ceil(res.route.duration / 60);
              }
            }
          });
          
          // Re-render UI with accurate routing info
          renderUI(fastestIndex);
          this.showTacticalNotification(`ROUTES REFINED. FASTEST: ${sorted[fastestIndex].text.toUpperCase()}`);
        }).catch(console.error);

      } else {
        if (startupLoader) startupLoader.style.display = 'none';
        this.showTacticalNotification(`NO RESULTS FOUND NEARBY`);
        const container = document.getElementById('intel-results-container');
        if (container) container.style.display = 'none';
      }
    } catch (err: any) {
      if (startupLoader) startupLoader.style.display = 'none';
      const container = document.getElementById('intel-results-container');
      if (container) container.style.display = 'none';
      console.error('Tactical failure: POI scan failed', err);
      this.showTacticalNotification(`SCAN FAILED: ${err.message?.toUpperCase() || 'SERVER TIMEOUT'}`);
    }
  }

  private showTacticalNotification(message: string) {
    const feed = document.getElementById('intel-feed');
    if (!feed) return;
    
    const notification = document.createElement('div');
    notification.className = 'glass-panel alert-item alert-info';
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
}

(window as any).app = new App();

(window as any).startIntelNavigation = (lng: number, lat: number, name: string) => {
  const destInput = document.getElementById('dest-input') as HTMLInputElement;
  if (destInput) {
    destInput.value = name;
  }
  // Access the singleton app instance
  const app = (window as any).app as any;
  if (app) {
    app.handleGeocodingSelection(name, [lng, lat], 'destination');
    const container = document.getElementById('intel-results-container');
    if (container) container.style.display = 'none';
    // If origin is already set, immediately generate route
    if (app.currentOriginCoords && app.currentDestCoords) {
      // Ensure transport type is set (default is 'car')
      app.finalizeRouting(app.currentTransportType);
    }
  }
};
