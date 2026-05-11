import { MapRenderer } from './view/mapRenderer';
import { intelligence } from './engine/intelligenceManager';
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

class App {
  private map!: MapRenderer;
  private token: string | null = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibXppa2F5aXNlMDEiLCJhIjoiY21vczd4ajc4MDA5ODJ3c2R3NDV2dHI0NSJ9.gbvq-aQiEttYKka8u4qmqg';
  private routeOptimizer!: RouteOptimizer;
  private currentOriginCoords: [number, number] | null = null;
  private currentDestCoords: [number, number] | null = null;
  private navSystem!: NavigationSystem;
  private currentTransportType: TransportType = 'car';
  private tripStartTime: number = 0;
  private tripTotalDistance: number = 0;
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
      <div id="cinematic-container">
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

          <!-- BOTTOM HUD: GTA Style Stats -->
          <div class="bottom-hud-container">
            <div class="gta-stats-panel">
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
                </div>
              </div>

              <div id="nav-bottom-bar" class="gta-hud-pill nav-bar-minimal" style="display: none;">
                <div class="nav-info-group">
                  <span id="nav-eta-time" class="nav-main-eta">--</span>
                  <div class="nav-sub-info">
                    <span id="nav-distance">--</span> • <span id="nav-arrival">--</span>
                  </div>
                </div>
                <button id="exit-nav" class="exit-nav-btn">EXIT</button>
              </div>
            </div>
          </div>

          <!-- Floating Controls -->
          <div class="floating-controls">
            <button id="recenter-btn" class="gta-hud-circle recenter-btn" style="display: none;" title="Re-center">🎯</button>
            <button id="weather-toggle" class="gta-hud-circle weather-toggle-btn" title="Toggle Weather">⛅</button>
          </div>

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

        this.navSystem.startTracking();
        this.map.enterNavigationMode();
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
        const text = (e.currentTarget as HTMLElement).innerText;
        sidebar?.classList.remove('open');
        
        if (text.includes('Saved Sectors')) {
          this.map.flyTo(28.0473, -26.2041, 15);
          this.showTacticalNotification('NAVIGATING TO SECTOR: ALPHA-ONE');
        } else if (text.includes('Recent Missions')) {
          this.showTacticalNotification('LOADING MISSION ARCHIVES...');
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

    // Weather
    document.getElementById('weather-toggle')?.addEventListener('click', () => {
      if (this.map.visualEffects) this.map.visualEffects.toggleWeather();
    });

    // POI Dropdown
    const dropdownToggle = document.getElementById('poi-dropdown-toggle');
    const dropdownMenu = document.getElementById('poi-dropdown-menu');

    dropdownToggle?.addEventListener('click', () => {
      dropdownMenu?.classList.toggle('show');
      dropdownToggle.classList.toggle('active');
    });

    document.querySelectorAll('[data-poi]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).dataset.poi!;
        this.filterUrbanIntelligence(cat);
        dropdownMenu?.classList.remove('show');
        dropdownToggle?.classList.remove('active');
      });
    });
  }

  private async handleGeocoding(query: string, mode: 'origin' | 'destination') {
    if (!query || query.length < 2) return;
    
    if (this.geocodingAbortController) this.geocodingAbortController.abort();
    this.geocodingAbortController = new AbortController();

    try {
      const proximity = this.currentOriginCoords ? `&proximity=${this.currentOriginCoords[0]},${this.currentOriginCoords[1]}` : '';
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}${proximity}&limit=5&country=ZA`;
      
      const res = await fetch(url, { signal: this.geocodingAbortController.signal });
      const data = await res.json();
      this.displaySuggestions(data.features, mode);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Geocoding fail:', e);
    }
  }

  private displaySuggestions(features: any[], mode: 'origin' | 'destination') {
    const list = mode === 'destination' ? document.getElementById('suggestions-list') : document.getElementById('origin-suggestions');
    if (!list) return;

    list.innerHTML = features.map(f => `
      <div class="suggestion-item" data-lng="${f.center[0]}" data-lat="${f.center[1]}" data-text="${f.text}">
        <div class="sugg-main">${f.text}</div>
        <div class="sugg-sub">${f.place_name}</div>
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
    
    const firstTab = document.querySelector('.transport-tab') as HTMLElement;
    if (firstTab) firstTab.click();
  }

  private async finalizeRouting(type: TransportType) {
    if (!this.currentOriginCoords || !this.currentDestCoords) return;

    if (this.routingAbortController) this.routingAbortController.abort();
    this.routingAbortController = new AbortController();

    const profile = TRANSPORT_PROFILES[type].mapboxProfile;
    
    try {
      const route = await this.routeOptimizer.fetchAndOptimizeRoute(
        this.currentOriginCoords,
        this.currentDestCoords,
        profile,
        this.routingAbortController.signal
      );

      if (route) {
        this.map.executeCameraSequence(this.currentOriginCoords, this.currentDestCoords, route.coordinates);
        this.startNavigation(route);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Routing fail:', e);
    }
  }

  private startNavigation(route: OptimizedRoute) {
    this.tripStartTime = Date.now();
    this.tripTotalDistance = route.distance;
    
    this.navSystem.start(route, TRANSPORT_PROFILES[this.currentTransportType].mapboxProfile);
    
    document.getElementById('nav-bottom-bar')!.style.display = 'flex';
    document.getElementById('recenter-btn')!.style.display = 'flex';
    document.getElementById('maneuver-card')!.style.display = 'flex';
    
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

  private stopNavigation() {
    this.navSystem.stop();
    this.map.exitNavigationMode();
    this.map.visualEffects.clearRoute();
    
    document.getElementById('nav-bottom-bar')!.style.display = 'none';
    document.getElementById('recenter-btn')!.style.display = 'none';
    document.getElementById('maneuver-card')!.style.display = 'none';
    document.getElementById('hazard-fab')!.style.display = 'none';
    document.getElementById('directions-view')!.style.display = 'none';
    document.getElementById('search-view')!.style.display = 'flex';
    
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

  private setupNavigationStateListener() {
    this.navSystem.onUpdate = (state) => {
      const { min, max } = this.navSystem.getZoomRange();
      this.map.updateCameraForNav(state.currentPosition, state.heading, state.speed, min, max);

      if (this.map.visualEffects) {
        this.map.visualEffects.updateUserVehicle(state.currentPosition, state.heading);
      }

      const navBottomBar = document.getElementById('nav-bottom-bar');
      if (navBottomBar && navBottomBar.style.display === 'flex') {
        const speedMs = state.speed > 1 ? state.speed : 13.8; 
        const remainingSeconds = state.totalDistanceRemaining / speedMs;
        
        const etaEl = document.getElementById('nav-eta-time');
        const distEl = document.getElementById('nav-distance');
        if (etaEl) etaEl.innerText = this.formatDuration(remainingSeconds);
        if (distEl) distEl.innerText = `${(state.totalDistanceRemaining / 1000).toFixed(1)} km`;

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

  private async filterUrbanIntelligence(category: string) {
    const center = this.map.map.getCenter();
    
    const statusText = document.getElementById('loader-status');
    const startupLoader = document.getElementById('startup-loader');
    if (startupLoader && statusText) {
      startupLoader.style.display = 'flex';
      startupLoader.style.background = 'rgba(0,0,0,0.4)';
      statusText.innerText = `SCANNING SECTOR FOR: ${category.toUpperCase()}...`;
      setTimeout(() => { startupLoader.style.display = 'none'; }, 1200);
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${category}.json?proximity=${center.lng},${center.lat}&access_token=${this.token}&limit=12`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        data.features.forEach((feature: any) => {
          const [lng, lat] = feature.center;
          this.map.addTacticalMarker({
            id: feature.id,
            type: category as any,
            location: [lng, lat],
            severity: 'info',
            message: feature.text,
            timestamp: Date.now()
          });
        });

        const sorted = data.features.map((f: any) => {
          const [lng, lat] = f.center;
          const dist = Math.sqrt(Math.pow(lng - center.lng, 2) + Math.pow(lat - center.lat, 2));
          return { ...f, dist };
        }).sort((a: any, b: any) => a.dist - b.dist);

        const nearest = sorted[0];
        const [nlng, nlat] = nearest.center;
        
        this.map.flyTo(nlng, nlat, 17.5);
        this.showTacticalNotification(`NEAREST FOUND: ${nearest.text.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Tactical failure: POI scan failed', err);
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

new App();
