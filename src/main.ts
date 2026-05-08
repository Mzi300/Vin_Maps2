import { MapRenderer } from './view/mapRenderer';
import { intelligence } from './engine/intelligenceManager';
import type { IntelligenceUpdate } from './engine/intelligenceManager';
import { TRANSPORT_PROFILES } from './data/transportModes';
import type { TransportType } from './data/transportModes';
import { GeolocationService } from './engine/geolocationService';
import { RouteOptimizer } from './engine/routeOptimizer';
import type { OptimizedRoute } from './engine/routeOptimizer';
import { NavigationSystem } from './engine/navigationSystem';
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

const RoutingState = {
  IDLE: 'IDLE',
  SEARCHING: 'SEARCHING',
  CALCULATING: 'CALCULATING',
  READY: 'READY',
  ERROR: 'ERROR'
} as const;

type RoutingStateValue = typeof RoutingState[keyof typeof RoutingState];

class App {
  private map!: MapRenderer;
  private token: string | null = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibXppa2F5aXNlMDEiLCJhIjoiY21vczd4ajc4MDA5ODJ3c2R3NDV2dHI0NSJ9.gbvq-aQiEttYKka8u4qmqg';
  private routeOptimizer!: RouteOptimizer;
  private currentOriginCoords: [number, number] | null = null;
  private currentDestCoords: [number, number] | null = null;
  private pendingRoutePromise: Promise<OptimizedRoute | null> | null = null;
  private navSystem!: NavigationSystem;
  private currentTransportType: TransportType = 'car';
  private tripStartTime: number = 0;
  private tripTotalDistance: number = 0;
  private tripIsActive: boolean = false;
  private geocodingAbortController: AbortController | null = null;
  private routingAbortController: AbortController | null = null;

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
      <div class="radar-scan"></div>
      <div id="map-container"></div>
      
      <div id="sidebar" class="glass-panel sidebar-panel">
        <div class="sidebar-header">
          <h2 style="color:var(--primary-accent); font-size:1.2rem;">VIMAPS COMMAND</h2>
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
            <button class="sidebar-item">📈 Your Timeline</button>
            <button class="sidebar-item">🛡️ Data in Maps</button>
            <button class="sidebar-item">🔗 Share or Embed</button>
          </div>
        </div>
      </div>

      <div class="ui-overlay">
        <!-- Maneuver Instruction Card -->
        <div id="maneuver-card" class="glass-panel maneuver-card" style="display: none;">
          <div class="maneuver-icon" id="maneuver-icon">↑</div>
          <div class="maneuver-text">
            <span id="maneuver-instruction" class="instruction-main">Follow route</span>
            <span id="maneuver-dist" class="instruction-sub">0 m</span>
          </div>
        </div>

        <button id="weather-toggle" class="weather-toggle-btn">Toggle Weather</button>
        <div class="top-controls">
          <div id="routing-engine" class="glass-panel command-bar search-state">
            <div id="search-view" class="search-section">
              <div class="input-group" style="width: 100%;">
                <button id="open-sidebar" class="menu-btn" style="margin-right: 5px;">☰</button>
                <input type="text" class="search-input" placeholder="Search South Africa..." id="dest-input" autocomplete="off" style="flex: 1;">
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
            </div>
          </div>
        </div>

        <div class="bottom-controls">
          <div class="glass-panel dropdown-container">
            <button id="poi-dropdown-toggle" class="cat-btn dropdown-toggle">
              🔍 Explore Intel <span class="arrow">▼</span>
            </button>
            <div id="poi-dropdown-menu" class="glass-panel dropdown-menu">
              <div class="dropdown-section">
                <label>VIMAPS INTEL</label>
                <button class="cat-btn" data-poi="hospital">🏥 Hospitals</button>
                <button class="cat-btn" data-poi="police">🛡️ Security</button>
                <button class="cat-btn" data-poi="bank">🏦 Financial</button>
                <button class="cat-btn" data-poi="fuel">⛽ Fuel</button>
                <button class="cat-btn" data-poi="hotel">🏨 Lodging</button>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-section">
                <label>MAPS EXPLORER</label>
                <button class="cat-btn" data-poi="restaurant">🍴 Restaurants</button>
                <button class="cat-btn" data-poi="hotel">🏨 Hotels</button>
                <button class="cat-btn" data-poi="attraction">🎡 Things to do</button>
                <button class="cat-btn" data-poi="museum">🏛️ Museums</button>
                <button class="cat-btn" data-poi="transit">🚌 Transit</button>
                <button class="cat-btn" data-poi="pharmacy">💊 Pharmacies</button>
                <button class="cat-btn" data-poi="atm">🏧 ATMs</button>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-section">
                <button class="sidebar-item" id="open-google-maps">🌐 Search Google Maps</button>
              </div>
            </div>
          </div>
          
          <div class="glass-panel info-readout" id="info-readout">
            <div id="route-display" class="route-display">
              <div id="route-idle">
                <span id="route-title" class="tactical-title">SITREP: Johannesburg Sector</span>
                <span id="route-eta" class="eta-badge">Awaiting mission parameters...</span>
              </div>
              <div id="route-active" style="display: none; flex-direction: column; gap: 4px;">
                <div class="summary-row"><strong>Destination:</strong> <span id="summary-dest" class="glow-text">--</span></div>
                <div class="summary-row"><strong>Distance:</strong> <span id="summary-dist">--</span></div>
                <div class="summary-row"><strong>ETA:</strong> <span id="summary-eta">--</span></div>
              </div>
            </div>
            
            <div id="advanced-toggle-area" style="display: none; margin-top: 8px; border-top: 1px solid var(--glass-border); padding-top: 8px;">
              <button id="toggle-advanced" class="text-btn" style="font-size: 0.7rem; color: var(--text-dim);">Advanced Tactical Data ▼</button>
              <div id="advanced-details" style="display: none; margin-top: 5px; font-size: 0.7rem; color: var(--primary-accent); font-family: monospace;">
                <div>Safety Score: <span id="detail-safety">--</span></div>
                <div>System Latency: <span id="detail-latency">--</span></div>
              </div>
            </div>
            <div id="ai-reasoning" class="ai-brief" style="display: none;"></div>
          </div>

          <!-- Minimal Navigation Bar (Google Maps Style) -->
          <div id="nav-bottom-bar" class="glass-panel nav-bar-minimal" style="display: none;">
            <div class="nav-info-group">
              <span id="nav-eta-time" class="nav-main-eta">--</span>
              <div class="nav-sub-info">
                <span id="nav-distance">--</span> • <span id="nav-arrival">--</span>
              </div>
            </div>
            <button id="exit-nav" class="exit-nav-btn">EXIT</button>
          </div>

          <!-- Re-center Button (Visible when camera is unlocked) -->
          <button id="recenter-btn" class="glass-panel recenter-btn" style="display: none;">
            <span class="icon">🎯</span> RE-CENTER
          </button>

          <!-- Hazard Reporting FAB -->
          <div id="hazard-fab" class="hazard-fab" style="display: none;">
            <button class="hazard-btn pothole" onclick="app.reportHazard('pothole')">🕳️</button>
            <button class="hazard-btn accident" onclick="app.reportHazard('accident')">💥</button>
            <button class="hazard-btn roadblock" onclick="app.reportHazard('roadblock')">🚧</button>
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

    this.map = new MapRenderer('map-container', this.token!);
    (window as any).app = this;
    (window as any).appMap = this.map;
    
    this.routeOptimizer = new RouteOptimizer(this.token!);
    this.navSystem = new NavigationSystem();
    this.routeOptimizer.prewarmRouting();
    
    this.map.map.on('load', () => {
      const geoService = new GeolocationService(this.map.map);
      const loader = document.getElementById('startup-loader');
      const loaderStatus = document.getElementById('loader-status');
      
      if (loaderStatus) loaderStatus.innerText = 'Acquiring high-precision lock...';

      geoService.initializeLocation((coords) => {
        this.currentOriginCoords = coords;
        this.map.flyTo(coords[0], coords[1], 15.5); 
        
        if (this.map.visualEffects) {
          (this.map.visualEffects as any).updateUserLocationGlow(coords);
        }

        // 1. Start continuous tracking and enter follow mode by default
        this.navSystem.startTracking();
        this.map.enterNavigationMode();

        // 2. Setup the global update listener early to track vehicle before routing
        this.setupNavigationStateListener();

        if (loader) {
          loader.classList.add('hidden');
          setTimeout(() => loader.remove(), 800);
        }
      });
    });

    this.setupListeners();
  }

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  private updateUIState(state: RoutingStateValue) {
    const status = document.getElementById('route-title')!;
    const eta = document.getElementById('route-eta')!;

    switch (state) {
      case RoutingState.IDLE:
        document.getElementById('route-idle')!.style.display = 'block';
        document.getElementById('route-active')!.style.display = 'none';
        document.getElementById('advanced-toggle-area')!.style.display = 'none';
        status.innerText = 'SITREP: Johannesburg Sector';
        eta.innerText = 'Waiting for target coordinates...';
        break;
      case RoutingState.SEARCHING:
        eta.innerText = 'Synchronizing geocoding...';
        break;
      case RoutingState.CALCULATING:
        document.getElementById('route-idle')!.style.display = 'block';
        document.getElementById('route-active')!.style.display = 'none';
        status.innerText = '[ CALCULATING ROUTE ]';
        eta.innerHTML = `<span style="color:var(--warning)">PROCESSING...</span>`;
        break;
      case RoutingState.READY:
        document.getElementById('route-idle')!.style.display = 'none';
        document.getElementById('route-active')!.style.display = 'none'; // HIDE SUMMARY AS REQUESTED
        document.getElementById('info-readout')!.style.display = 'none'; // HIDE CARD
        document.getElementById('advanced-toggle-area')!.style.display = 'none';
        document.querySelector('.dropdown-container')!.classList.add('hidden');
        document.getElementById('nav-bottom-bar')!.style.display = 'flex';
        break;
      case RoutingState.ERROR:
        document.getElementById('route-idle')!.style.display = 'block';
        document.getElementById('route-active')!.style.display = 'none';
        status.innerText = '[ ERROR ]';
        eta.innerHTML = `<span style="color:var(--danger)">FAILED</span>`;
        break;
    }
  }

  private setupListeners() {
    const destInput = document.getElementById('dest-input') as HTMLInputElement;
    const originInput = document.getElementById('origin-input') as HTMLInputElement;
    const lockBtn = document.getElementById('lock-dest');
    const closeDirections = document.getElementById('close-directions');
    const locateBtn = document.getElementById('locate-me');
    const locateOriginBtn = document.getElementById('locate-origin');
    const sidebar = document.getElementById('sidebar');

    const debouncedGeocode = this.debounce((input: HTMLInputElement, listId: string) => {
      const query = input.value;
      if (query.length >= 2) {
        this.updateUIState(RoutingState.SEARCHING);
        this.fetchSuggestions(query, listId, input);
      } else {
        document.getElementById(listId)!.style.display = 'none';
      }
    }, 400);

    destInput?.addEventListener('input', () => debouncedGeocode(destInput, 'suggestions-list'));
    originInput?.addEventListener('input', () => debouncedGeocode(originInput, 'origin-suggestions'));

    destInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.advanceToTransportStep(); });
    lockBtn?.addEventListener('click', () => this.advanceToTransportStep());
    closeDirections?.addEventListener('click', () => this.resetToSearch());
    locateBtn?.addEventListener('click', () => this.acquireLocation('origin-input'));
    locateOriginBtn?.addEventListener('click', () => this.acquireLocation('origin-input'));

    document.getElementById('close-sidebar')?.addEventListener('click', () => sidebar?.classList.remove('open'));

    document.getElementById('toggle-advanced')?.addEventListener('click', () => {
      const panel = document.getElementById('advanced-details')!;
      const isHidden = panel.style.display === 'none';
      panel.style.display = isHidden ? 'block' : 'none';
      document.getElementById('toggle-advanced')!.innerText = isHidden ? 'Advanced Tactical Data ▲' : 'Advanced Tactical Data ▼';
    });

    document.getElementById('exit-nav')?.addEventListener('click', () => {
      this.resetToSearch();
      document.querySelector('.dropdown-container')!.classList.remove('hidden');
    });

    document.getElementById('recenter-btn')?.addEventListener('click', () => {
      this.map.recenter();
    });

    window.addEventListener('nav-camera-unlocked', () => {
      const btn = document.getElementById('recenter-btn');
      if (btn) btn.style.display = 'flex';
    });

    window.addEventListener('nav-camera-locked', () => {
      const btn = document.getElementById('recenter-btn');
      if (btn) btn.style.display = 'none';
    });

    document.getElementById('weather-toggle')?.addEventListener('click', () => {
      if (this.map.visualEffects) this.map.visualEffects.toggleWeather();
    });

    // Dropdown Logic
    const dropdownToggle = document.getElementById('poi-dropdown-toggle');
    const dropdownMenu = document.getElementById('poi-dropdown-menu');

    dropdownToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle('active');
      const arrow = dropdownToggle.querySelector('.arrow') as HTMLElement;
      if (arrow) arrow.style.transform = dropdownMenu?.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    document.addEventListener('click', () => {
      dropdownMenu?.classList.remove('active');
      const arrow = dropdownToggle?.querySelector('.arrow') as HTMLElement;
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    });

    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const poi = (e.currentTarget as HTMLButtonElement).dataset.poi;
        if (poi) {
          this.filterUrbanIntelligence(poi);
          dropdownMenu?.classList.remove('active');
        }
      });
    });

    document.getElementById('open-google-maps')?.addEventListener('click', () => {
      const query = (document.getElementById('dest-input') as HTMLInputElement).value;
      const url = query ? `https://www.google.com/maps/search/${encodeURIComponent(query)}` : `https://www.google.com/maps`;
      window.open(url, '_blank');
    });

    document.querySelectorAll('.transport-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.transport-tab').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        const type = (e.currentTarget as HTMLElement).dataset.type as TransportType;
        this.finalizeRouting(type);
      });
    });

    intelligence.on('intelligence-update', (update: IntelligenceUpdate) => {
      this.addAlertToFeed(update);
    });

    window.addEventListener('poi-intelligence', (e: any) => {
      const { name, category, location } = e.detail;
      this.handlePoiSelection(name, category, location);
    });
  }

  private handlePoiSelection(name: string, category: string, location: [number, number]) {
    this.currentDestCoords = location;
    const status = document.getElementById('route-title')!;
    const reasoning = document.getElementById('ai-reasoning')!;
    const eta = document.getElementById('route-eta')!;

    status.innerText = `URBAN INTEL: ${name.toUpperCase()}`;
    eta.innerHTML = `<span class="glow-text" style="color:var(--primary-accent)">${category.toUpperCase()}</span> | NODE IDENTIFIED`;
    
    const brief = `Intelligence Briefing: ${name} is a designated ${category} within the sector. Strategic significance: Urban Infrastructure Node. Coordinates: ${location[0].toFixed(4)}, ${location[1].toFixed(4)}. Site is currently accessible.`;
    
    this.typeWriter(reasoning, brief);
    this.speakBriefing(brief);
    this.map.flyTo(location[0], location[1]);
  }

  private async fetchSuggestions(query: string, listId: string, inputEl: HTMLInputElement) {
    if (this.geocodingAbortController) this.geocodingAbortController.abort();
    this.geocodingAbortController = new AbortController();

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}&country=za&limit=5`;
    try {
      const resp = await fetch(url, { signal: this.geocodingAbortController.signal });
      const data = await resp.json();
      this.renderSuggestions(data.features, listId, inputEl);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Search failed:', err);
    }
  }

  private renderSuggestions(features: any[], listId: string, inputEl: HTMLInputElement) {
    const list = document.getElementById(listId)!;
    if (features.length === 0) { list.style.display = 'none'; return; }

    list.innerHTML = features.map(f => `
      <div class="suggestion-item" data-name="${f.text}" data-lng="${f.center[0]}" data-lat="${f.center[1]}">
        <span class="sugg-icon">📍</span>
        <div class="sugg-info"><div class="sugg-name">${f.text}</div><div class="sugg-sub">${f.place_name.split(',').slice(1).join(',')}</div></div>
      </div>
    `).join('');

    list.style.display = 'block';
    list.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        inputEl.value = el.dataset.name!;
        if (el.dataset.lng && el.dataset.lat) {
          const coords: [number, number] = [parseFloat(el.dataset.lng), parseFloat(el.dataset.lat)];
          if (inputEl.id === 'dest-input') this.currentDestCoords = coords;
          else this.currentOriginCoords = coords;
        }
        list.style.display = 'none';
        if (inputEl.id === 'dest-input') this.advanceToTransportStep();
      });
    });
  }

  private async acquireLocation(targetId: string = 'origin-input') {
    const reasoning = document.getElementById('ai-reasoning')!;
    reasoning.innerText = "AI Assistant: Acquiring high-precision GPS lock...";
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { longitude, latitude } = pos.coords;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.token}&types=address`;
      try {
        const resp = await fetch(url);
        const data = await resp.json();
        const address = data.features[0]?.place_name || "Current Location";
        const targetInput = document.getElementById(targetId) as HTMLInputElement;
        if (targetInput) targetInput.value = address;
        
        const coords: [number, number] = [longitude, latitude];
        if (targetId === 'dest-input') this.currentDestCoords = coords;
        else this.currentOriginCoords = coords;

        if (this.map.visualEffects) {
          (this.map.visualEffects as any).updateUserLocationGlow(coords);
        }

        reasoning.innerText = `AI Assistant: Position acquired: ${address}.`;
        this.map.flyTo(longitude, latitude);

        // If we have both coords now, refresh the route line
        if (this.currentOriginCoords && this.currentDestCoords) {
          this.advanceToTransportStep();
        }
      } catch (e) { console.error('Reverse geocode failed', e); }
    }, (err) => { reasoning.innerText = `AI Assistant: GPS acquisition failed: ${err.message}`; });
  }

  private advanceToTransportStep() {
    const searchView = document.getElementById('search-view')!;
    const directionsView = document.getElementById('directions-view')!;
    const destInput = document.getElementById('dest-input') as HTMLInputElement;
    const finalDestDisplay = document.getElementById('final-dest-display') as HTMLInputElement;

    if (!destInput.value) return;

    searchView.style.display = 'none';
    directionsView.style.display = 'flex';
    finalDestDisplay.value = destInput.value;

    // Pre-fetch route in background without blocking UI
    if (this.currentOriginCoords && this.currentDestCoords) {
      if (this.routingAbortController) this.routingAbortController.abort();
      this.routingAbortController = new AbortController();
      
      console.log('[App] Pre-fetching route...');
      this.pendingRoutePromise = this.routeOptimizer.fetchAndOptimizeRoute(
        this.currentOriginCoords, 
        this.currentDestCoords, 
        'driving',
        this.routingAbortController.signal
      ).catch(err => {
        console.error('[App] Pre-fetch failed:', err);
        return null;
      }).then(async route => {
        if (route) {
          // Wait for map to be ready and visualEffects to be initialized
          let attempts = 0;
          while (!this.map.visualEffects && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
          }
          
          if (this.map.visualEffects) {
            this.map.visualEffects.drawGlowingRoute(this.currentOriginCoords!, this.currentDestCoords!, route.coordinates);
            this.map.flyTo(this.currentOriginCoords![0], this.currentOriginCoords![1]);
          }
        }
        return route;
      });
    }
  }

  private resetToSearch() {
    if (this.routingAbortController) this.routingAbortController.abort();
    if (this.map.visualEffects) this.map.visualEffects.clearRoute();
    
    document.getElementById('search-view')!.style.display = 'flex';
    document.getElementById('directions-view')!.style.display = 'none';
    document.getElementById('nav-bottom-bar')!.style.display = 'none';
    document.getElementById('info-readout')!.style.display = 'block';
    document.querySelector('.category-bar')!.classList.remove('hidden');
    
    document.getElementById('maneuver-card')!.style.display = 'none';
    document.getElementById('hazard-fab')!.style.display = 'none';

    if (this.tripIsActive) this.showTripSummary();
    this.tripIsActive = false;

    this.updateUIState(RoutingState.IDLE);
  }

  private async finalizeRouting(type: TransportType) {
    this.currentTransportType = type;
    if (this.map.visualEffects) {
      this.map.visualEffects.setTransportMode(TRANSPORT_PROFILES[type].icon);
    }
    // const dest = (document.getElementById('final-dest-display') as HTMLInputElement).value;
    
    // 1. Critical GPS Auto-Lock: Fetch fresh accurate position before calculating route
    const statusText = document.getElementById('loader-status');
    if (statusText) statusText.innerText = 'Synchronizing GPS lock...';
    
    if (!this.currentOriginCoords) {
      const geoService = new GeolocationService(this.map.map);
      this.currentOriginCoords = await new Promise<[number, number]>((resolve) => {
        const timeout = setTimeout(() => resolve([28.0163, -26.2307]), 3000);
        geoService.initializeLocation((coords) => {
          clearTimeout(timeout);
          resolve(coords);
        });
      });
    }
    this.updateUIState(RoutingState.CALCULATING);

    if (this.routingAbortController) this.routingAbortController.abort();
    this.routingAbortController = new AbortController();

    console.log('[App] Starting finalizeRouting for type:', type);
    
    let route: OptimizedRoute | null = null;
    try {
      if (this.pendingRoutePromise) {
        console.log('[App] Using pendingRoutePromise...');
        route = await this.pendingRoutePromise;
        this.pendingRoutePromise = null;
      } else {
        console.log('[App] Fetching new route...');
        const profile = type === 'car' ? 'driving' : type === 'pedestrian' ? 'walking' : 'driving';
        route = await this.routeOptimizer.fetchAndOptimizeRoute(
          this.currentOriginCoords!, 
          this.currentDestCoords!, 
          profile,
          this.routingAbortController.signal
        );
      }
    } catch (err: any) {
      console.error('[App] Routing error:', err);
      if (err.name === 'AbortError') return;
    }

    console.log('[App] Route received:', route ? 'SUCCESS' : 'NULL');

    if (!route) {
      this.updateUIState(RoutingState.ERROR);
      return;
    }

    const { brief } = intelligence.generateTacticalBriefing(route, type);
    const arrivalTime = new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.updateUIState(RoutingState.READY);
    
    // FORMAT DATA FOR CLEAN DISPLAY
    // const distanceKm = Math.round(route.distance / 1000);
    const totalMinutes = Math.floor(route.duration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    const etaFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    document.getElementById('nav-eta-time')!.innerText = etaFormatted;
    document.getElementById('nav-arrival')!.innerText = arrivalTime;
    document.getElementById('nav-distance')!.innerText = `${(route.distance / 1000).toFixed(1)} km`;
    
    // Debug: Update status in UI
    const statusEl = document.getElementById('loader-status');
    if (statusEl) statusEl.innerText = 'Route Active';

    // Only speak the briefing, do not show narrative text in UI
    this.speakBriefing(brief);
    
    // 2. Ensure vehicle is exactly at GPS start before transition
    if (this.map.visualEffects && this.currentDestCoords) {
      this.map.visualEffects.drawGlowingRoute(this.currentOriginCoords!, this.currentDestCoords, route.coordinates);
    }

    // 3. Smooth Camera Mode Transition: overview -> driver perspective
    if (this.currentDestCoords) {
      this.map.executeCameraSequence(this.currentOriginCoords!, this.currentDestCoords, route.coordinates);
    }

    // 4. Snap navigation system to exact starting coordinates (bypass smoothing)
    let initialHeading = 0;
    if (route.coordinates.length >= 2) {
      const p1 = route.coordinates[0];
      const p2 = route.coordinates[1];
      initialHeading = (Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI;
    }
    this.navSystem.snapToPosition(this.currentOriginCoords!, initialHeading);

    // Setup Navigation System is handled by the global setupNavigationStateListener

    // Auto-start Navigation Mode
    this.map.enterNavigationMode();
    if (this.map.visualEffects) this.map.visualEffects.dimMapLayers(true);
    
    // Show Navigation UI
    document.getElementById('directions-view')!.style.display = 'none';
    document.getElementById('nav-bottom-bar')!.style.display = 'flex';
    document.getElementById('info-readout')!.style.display = 'none';
    document.querySelector('.category-bar')?.classList.add('hidden');

    this.navSystem.start(route, type);
    
    // Initialize Trip Data
    this.tripStartTime = Date.now();
    this.tripTotalDistance = route.distance;
    this.tripIsActive = true;
    document.getElementById('hazard-fab')!.style.display = 'flex';
    
    // Hook into off-route detection
    this.navSystem.onOffRoute = () => {
      console.log('[Navigation] Deviation detected. Re-routing...');
      this.speakBriefing("Recalculating route.");
      this.finalizeRouting(this.currentTransportType);
    };
  }

  public reportHazard(type: string) {
    if (!this.currentOriginCoords) return;
    const pos = this.navSystem.getCurrentPosition() || this.currentOriginCoords;
    intelligence.report({
      type: 'HAZARD',
      payload: { type, location: pos },
      timestamp: Date.now()
    });
    this.speakBriefing(`Reporting ${type} at current location.`);
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

  private getManeuverIcon(type: string): string {
    switch (type) {
      case 'turn': return '⤴';
      case 'continue': return '↑';
      case 'merge': return 'Merge';
      case 'depart': return '🏁';
      case 'arrive': return '📍';
      default: return '↑';
    }
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
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

  private filterUrbanIntelligence(category: string) {
    const reasoning = document.getElementById('ai-reasoning')!;
    document.getElementById('route-title')!.innerText = `[ FILTERING: ${category.toUpperCase()} ]`;
    reasoning.innerText = `AI Assistant: Highlighting all ${category} nodes. Monitoring availability...`;
    
    this.map.setPoiFilter(category);
  }

  private setupNavigationStateListener() {
    this.navSystem.onUpdate = (state) => {
      // Update camera follow mode
      const { min, max } = this.navSystem.getZoomRange();
      this.map.updateCameraForNav(state.currentPosition, state.heading, state.speed, min, max);

      // Update vehicle visually
      if (this.map.visualEffects) {
        this.map.visualEffects.updateUserVehicle(state.currentPosition, state.heading);
      }

      // If a route is active, update the UI
      const navBottomBar = document.getElementById('nav-bottom-bar');
      if (navBottomBar && navBottomBar.style.display === 'flex') {
        const speedMs = state.speed > 1 ? state.speed : 13.8; 
        const remainingSeconds = state.totalDistanceRemaining / speedMs;
        document.getElementById('nav-eta-time')!.innerText = this.formatDuration(remainingSeconds);
        document.getElementById('nav-distance')!.innerText = `${(state.totalDistanceRemaining / 1000).toFixed(1)} km`;

        // Update Maneuver UI
        const card = document.getElementById('maneuver-card')!;
        if (state.isMoving) {
          card.style.display = 'flex';
          document.getElementById('maneuver-dist')!.innerText = `${Math.round(state.distanceToNext)} m`;
          
          // Start animation only when movement detected
          if (this.map.visualEffects) {
            this.map.visualEffects.startNavigationAnimation();
          }

          // Find current step from the active route
          const route = (this.navSystem as any).route; 
          if (route && route.steps) {
            const currentStep = route.steps[this.navSystem.currentStepIndex]; 
            if (currentStep) {
              document.getElementById('maneuver-instruction')!.innerText = currentStep.maneuver.instruction;
              document.getElementById('maneuver-icon')!.innerText = this.getManeuverIcon(currentStep.maneuver.type);
            }
          }
        }
      }
    };
  }

  private typeWriter(element: HTMLElement, text: string) {
    element.innerText = '';
    let i = 0;
    const interval = setInterval(() => {
      element.innerText += text.charAt(i);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 20);
  }

  private addAlertToFeed(update: IntelligenceUpdate) {
    const feed = document.getElementById('intel-feed');
    if (!feed) return;
    const alert = document.createElement('div');
    alert.className = `glass-panel alert-item alert-${update.severity}`;
    alert.innerHTML = `<strong>${update.type.toUpperCase()}</strong>: ${update.message}`;
    feed.prepend(alert);
  }

  private updateUIState(state: RoutingStateValue) {
    const statusText = document.getElementById('loader-status');
    const reasoning = document.getElementById('ai-reasoning')!;
    
    switch (state) {
      case RoutingState.IDLE:
        if (statusText) statusText.innerText = 'Ready';
        reasoning.style.display = 'none';
        break;
      case RoutingState.CALCULATING:
        if (statusText) statusText.innerText = 'Calculating Tactical Route...';
        reasoning.style.display = 'block';
        reasoning.innerText = 'AI Assistant: Analyzing sector data and optimizing path...';
        break;
      case RoutingState.READY:
        if (statusText) statusText.innerText = 'Tactical Route Established';
        reasoning.style.display = 'block';
        break;
      case RoutingState.ERROR:
        if (statusText) statusText.innerText = 'Routing Failed';
        reasoning.style.display = 'block';
        reasoning.innerText = 'AI Assistant: Strategic error. Could not establish route.';
        break;
    }
  }
}

new App();
