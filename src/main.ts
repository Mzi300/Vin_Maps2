import { MapRenderer } from './view/mapRenderer';
import { intelligence } from './engine/intelligenceManager';
import type { IntelligenceUpdate } from './engine/intelligenceManager';
import { TRANSPORT_PROFILES } from './data/transportModes';
import type { TransportType } from './data/transportModes';
import { GeolocationService } from './engine/geolocationService';
import { RouteOptimizer } from './engine/routeOptimizer';
import type { OptimizedRoute } from './engine/routeOptimizer';
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
          <div class="glass-panel category-bar">
            <button class="cat-btn" data-poi="hospital">🏥 Hospitals</button>
            <button class="cat-btn" data-poi="police">🛡️ Security</button>
            <button class="cat-btn" data-poi="bank">🏦 Financial</button>
            <button class="cat-btn" data-poi="fuel">⛽ Fuel</button>
            <button class="cat-btn" data-poi="hotel">🏨 Lodging</button>
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
        </div>

        <div id="intel-feed" class="intel-feed"></div>
      </div>
    `;

    this.map = new MapRenderer('map-container', this.token!);
    (window as any).appMap = this.map;
    
    this.routeOptimizer = new RouteOptimizer(this.token!);
    this.routeOptimizer.prewarmRouting();
    
    this.map.map.on('load', () => {
      const geoService = new GeolocationService(this.map.map);
      geoService.initializeLocation((coords) => {
        this.currentOriginCoords = coords;
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
        document.querySelector('.category-bar')!.classList.add('hidden');
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

    document.getElementById('exit-nav')?.addEventListener('click', () => this.resetToSearch());

    document.getElementById('weather-toggle')?.addEventListener('click', () => {
      if (this.map.visualEffects) this.map.visualEffects.toggleWeather();
    });

    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const poi = (e.currentTarget as HTMLButtonElement).dataset.poi!;
        this.filterUrbanIntelligence(poi);
      });
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

        reasoning.innerText = `AI Assistant: Position acquired: ${address}.`;
        this.map.flyTo(longitude, latitude);
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
      this.pendingRoutePromise = this.routeOptimizer.fetchAndOptimizeRoute(
        this.currentOriginCoords, 
        this.currentDestCoords, 
        'driving',
        this.routingAbortController.signal
      );
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
    
    this.updateUIState(RoutingState.IDLE);
  }

  private async finalizeRouting(type: TransportType) {
    const dest = (document.getElementById('final-dest-display') as HTMLInputElement).value;
    
    if (!this.currentOriginCoords || !this.currentDestCoords) {
      this.updateUIState(RoutingState.ERROR);
      return;
    }

    // Only show Calculating UI if we don't have a pending/cached route ready
    if (!this.pendingRoutePromise) {
      this.updateUIState(RoutingState.CALCULATING);
    }

    if (this.routingAbortController) this.routingAbortController.abort();
    this.routingAbortController = new AbortController();

    let route: OptimizedRoute | null = null;
    try {
      if (this.pendingRoutePromise) {
        route = await this.pendingRoutePromise;
        this.pendingRoutePromise = null;
      } else {
        const profile = type === 'car' ? 'driving' : type === 'pedestrian' ? 'walking' : 'driving';
        route = await this.routeOptimizer.fetchAndOptimizeRoute(
          this.currentOriginCoords, 
          this.currentDestCoords, 
          profile,
          this.routingAbortController.signal
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
    }

    if (!route) {
      this.updateUIState(RoutingState.ERROR);
      return;
    }

    this.updateUIState(RoutingState.READY);
    
    // FORMAT DATA FOR CLEAN DISPLAY
    const distanceKm = Math.round(route.distance / 1000);
    const totalMinutes = Math.floor(route.duration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    const etaFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    document.getElementById('nav-eta-time')!.innerText = etaFormatted;
    document.getElementById('nav-distance')!.innerText = `${distanceKm} km`;
    
    const now = new Date();
    now.setMinutes(now.getMinutes() + totalMinutes);
    const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('nav-arrival')!.innerText = arrivalTime;

    // Only speak the briefing, do not show narrative text in UI
    const brief = `Starting route to ${dest}. Arrival expected at ${arrivalTime}.`;
    this.speakBriefing(brief);
    
    this.map.executeCameraSequence(this.currentOriginCoords, this.currentDestCoords, route.coordinates);
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
}

new App();
