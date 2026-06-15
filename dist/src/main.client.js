"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapRenderer_1 = require("./view/mapRenderer");
const intelligenceManager_1 = require("./engine/intelligenceManager");
const transportModes_1 = require("./data/transportModes");
const geolocationService_1 = require("./engine/geolocationService");
const routeOptimizer_1 = require("./engine/routeOptimizer");
const navigationSystem_1 = require("./engine/navigationSystem");
require("./style/index.css");
const auth_1 = require("./auth");
window.addEventListener('error', (e) => {
    const root = document.querySelector('#app');
    if (root) {
        const errorBox = document.createElement('div');
        errorBox.style.cssText = 'position:fixed; top:0; left:0; background:red; color:white; z-index:9999; padding:10px; font-family:monospace;';
        errorBox.innerText = `CRITICAL ERROR: ${e.message} at ${e.filename}:${e.lineno}`;
        root.appendChild(errorBox);
    }
});
class App {
    map;
    token = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibXppa2F5aXNlMDEiLCJhIjoiY21vczd4ajc4MDA5ODJ3c2R3NDV2dHI0NSJ9.gbvq-aQiEttYKka8u4qmqg';
    routeOptimizer;
    currentOriginCoords = null;
    currentDestCoords = null;
    navSystem;
    currentTransportType = 'car';
    tripStartTime = 0;
    tripTotalDistance = 0;
    geocodingAbortController = null;
    pendingRoute = null;
    routingAbortController = null;
    authState = (0, auth_1.getAuthState)();
    constructor() {
        this.init();
    }
    init() {
        if (!this.token) {
            console.error('Critical: Mapbox Token missing.');
            return;
        }
        const root = document.querySelector('#app');
        root.innerHTML = `
      <div class="scanline"></div>
      <div id="cinematic-container">
        <div id="map-container"></div>
        
        <div id="sidebar" class="glass-panel sidebar-panel">
          <div class="sidebar-header">
          <h2 style="color:var(--primary-accent); font-size:1.2rem;">VIMAPS COMMAND</h2>
          <div class="auth-section" id="auth-section">
            <button id="login-btn" class="login-btn">👤 Access VinMaps Intelligence Network</button>
            <p class="auth-helper">Navigate freely without login. Sign in to unlock synced missions, saved sectors, map intelligence, contribution history, stealth preferences, and cross-device access.</p>
          </div>
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
                    ${Object.values(transportModes_1.TRANSPORT_PROFILES).map(p => `
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
        this.map = new mapRenderer_1.MapRenderer('map-container', this.token);
        window.app = this;
        window.appMap = this.map;
        requestIdleCallback(() => {
            this.routeOptimizer = new routeOptimizer_1.RouteOptimizer(this.token);
            this.navSystem = new navigationSystem_1.NavigationSystem();
            this.routeOptimizer.prewarmRouting();
        });
        this.map.map.on('load', () => {
            const geoService = new geolocationService_1.GeolocationService(this.map.map);
            const loader = document.getElementById('startup-loader');
            const loaderStatus = document.getElementById('loader-status');
            if (loaderStatus)
                loaderStatus.innerText = 'WAITING FOR TACTICAL GPS LOCK...';
            const mapCanvas = this.map.map.getCanvas();
            if (mapCanvas)
                mapCanvas.style.opacity = '0';
            geoService.initializeLocation((coords) => {
                this.currentOriginCoords = coords;
                this.map.map.jumpTo({
                    center: coords,
                    zoom: 18.5,
                    pitch: 70
                });
                const mapCanvas = this.map.map.getCanvas();
                if (mapCanvas)
                    mapCanvas.style.opacity = '1';
                this.map.enterNavigationMode();
                if (this.map.cameraController) {
                    this.map.cameraController.current.zoom = 18.5;
                    this.map.cameraController.current.pitch = 68;
                    this.map.cameraController.update(coords, 0, 0, true);
                }
                const originInput = document.getElementById('origin-input');
                if (originInput)
                    originInput.value = 'Current Location';
                if (this.map.visualEffects) {
                    this.map.visualEffects.updateUserVehicle(coords, 0);
                    this.map.visualEffects.updateUserLocationGlow(coords);
                }
                if (!this.navSystem) {
                    this.navSystem = new navigationSystem_1.NavigationSystem();
                    this.routeOptimizer = new routeOptimizer_1.RouteOptimizer(this.token);
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
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    loadMajorCities() {
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
    setupListeners() {
        const destInput = document.getElementById('dest-input');
        const originInput = document.getElementById('origin-input');
        destInput?.addEventListener('input', this.debounce(() => {
            this.handleGeocoding(destInput.value, 'destination');
        }, 50));
        originInput?.addEventListener('input', this.debounce(() => {
            this.handleGeocoding(originInput.value, 'origin');
        }, 50));
        document.querySelectorAll('.transport-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.currentTransportType = type;
                document.querySelectorAll('.transport-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.finalizeRouting(type);
            });
        });
        const sidebar = document.getElementById('sidebar');
        document.getElementById('open-sidebar')?.addEventListener('click', () => sidebar?.classList.add('open'));
        document.getElementById('close-sidebar')?.addEventListener('click', () => sidebar?.classList.remove('open'));
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const text = e.currentTarget.innerText;
                sidebar?.classList.remove('open');
                if (text.includes('Saved Sectors')) {
                    if (!(0, auth_1.isAuthenticated)()) {
                        this.showLockMessage('Sign in to save sectors to cloud.');
                    }
                    else {
                        this.map.flyTo(28.0473, -26.2041, 15);
                        this.showTacticalNotification('NAVIGATING TO SECTOR: ALPHA-ONE');
                    }
                }
                else if (text.includes('Recent Missions')) {
                    this.showTacticalNotification('LOADING MISSION ARCHIVES...');
                }
            });
        });
        document.getElementById('lock-dest')?.addEventListener('click', () => {
            if (this.currentDestCoords)
                this.advanceToTransportStep();
        });
        document.getElementById('close-directions')?.addEventListener('click', () => {
            document.getElementById('directions-view').style.display = 'none';
            document.getElementById('search-view').style.display = 'flex';
            this.map.exitNavigationMode();
        });
        document.getElementById('locate-me')?.addEventListener('click', () => {
            if (this.currentOriginCoords) {
                this.map.flyTo(this.currentOriginCoords[0], this.currentOriginCoords[1]);
                this.showTacticalNotification('RE-CENTERING ON OPERATOR COORDINATES');
            }
        });
        document.getElementById('locate-origin')?.addEventListener('click', () => {
            if (this.currentOriginCoords) {
                document.getElementById('origin-input').value = 'Your Location';
                this.handleGeocodingSelection('Your Location', this.currentOriginCoords, 'origin');
            }
        });
        document.getElementById('exit-nav')?.addEventListener('click', () => this.stopNavigation());
        document.getElementById('recenter-btn')?.addEventListener('click', () => this.map.recenter());
        let is2D = false;
        const perspectiveToggle = document.getElementById('perspective-toggle');
        perspectiveToggle?.addEventListener('click', () => {
            is2D = !is2D;
            if (is2D) {
                this.map.cameraController?.setMode('DRIVING_2D');
                if (perspectiveToggle)
                    perspectiveToggle.innerText = '3D';
                this.showTacticalNotification('SWITCHED TO 2D MODE');
            }
            else {
                this.map.cameraController?.setMode('DRIVING');
                if (perspectiveToggle)
                    perspectiveToggle.innerText = '2D';
                this.showTacticalNotification('SWITCHED TO 3D MODE');
            }
        });
        document.getElementById('weather-toggle')?.addEventListener('click', () => {
            if (this.map.visualEffects)
                this.map.visualEffects.toggleWeather();
        });
        document.getElementById('start-navigation-btn')?.addEventListener('click', () => {
            if (this.pendingRoute) {
                document.getElementById('route-preview-panel').style.display = 'none';
                this.map.executeCameraSequence(this.currentOriginCoords, this.currentDestCoords, this.pendingRoute.coordinates);
                this.startNavigation(this.pendingRoute);
            }
        });
        const dropdownToggle = document.getElementById('poi-dropdown-toggle');
        const dropdownMenu = document.getElementById('poi-dropdown-menu');
        dropdownToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.toggle('active');
            dropdownToggle.classList.toggle('active');
        });
        document.getElementById('close-poi-dropdown')?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.remove('active');
            dropdownToggle?.classList.remove('active');
        });
        document.addEventListener('click', () => {
            dropdownMenu?.classList.remove('active');
            dropdownToggle?.classList.remove('active');
        });
        document.querySelectorAll('[data-poi]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cat = e.currentTarget.dataset.poi;
                this.filterUrbanIntelligence(cat);
                dropdownMenu?.classList.remove('active');
                dropdownToggle?.classList.remove('active');
            });
        });
    }
    async handleGeocoding(query, mode) {
        if (!query || query.length < 2) {
            const list = mode === 'destination' ? document.getElementById('suggestions-list') : document.getElementById('origin-suggestions');
            if (list)
                list.style.display = 'none';
            return;
        }
        if (this.geocodingAbortController)
            this.geocodingAbortController.abort();
        this.geocodingAbortController = new AbortController();
        try {
            const proximity = this.currentOriginCoords ? `&proximity=${this.currentOriginCoords[0]},${this.currentOriginCoords[1]}` : '';
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.token}${proximity}&autocomplete=true&limit=10&country=ZA`;
            const res = await fetch(url, { signal: this.geocodingAbortController.signal });
            const data = await res.json();
            this.displaySuggestions(data.features || [], mode);
        }
        catch (e) {
            if (e.name !== 'AbortError')
                console.error('Geocoding fail:', e);
        }
    }
    displaySuggestions(features, mode) {
        const list = mode === 'destination' ? document.getElementById('suggestions-list') : document.getElementById('origin-suggestions');
        if (!list)
            return;
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
                const target = e.currentTarget;
                const coords = [parseFloat(target.dataset.lng), parseFloat(target.dataset.lat)];
                this.handleGeocodingSelection(target.dataset.text, coords, mode);
            });
        });
    }
    handleGeocodingSelection(name, coords, mode) {
        const inputId = mode === 'destination' ? 'dest-input' : 'origin-input';
        const listId = mode === 'destination' ? 'suggestions-list' : 'origin-suggestions';
        document.getElementById(inputId).value = name;
        document.getElementById(listId).style.display = 'none';
        if (mode === 'origin') {
            this.currentOriginCoords = coords;
        }
        else {
            this.currentDestCoords = coords;
            document.getElementById('final-dest-display').setAttribute('value', name);
            document.getElementById('final-dest-display').value = name;
            const reasoning = document.getElementById('loader-status');
            const address = name.split(',')[0];
            if (reasoning)
                reasoning.innerText = `AI Assistant: Position acquired: ${address}.`;
            this.map.flyTo(coords[0], coords[1]);
            if (this.currentOriginCoords && this.currentDestCoords) {
                this.advanceToTransportStep();
            }
        }
    }
    advanceToTransportStep() {
        document.getElementById('search-view').style.display = 'none';
        document.getElementById('directions-view').style.display = 'flex';
        document.querySelectorAll('.transport-tab').forEach(t => t.classList.remove('active'));
        document.getElementById('route-preview-panel').style.display = 'none';
        const reasoning = document.getElementById('loader-status');
        if (reasoning)
            reasoning.innerText = `AI Assistant: Awaiting transport mode selection.`;
    }
    simulateRouteCondition(route) {
        const conditions = [
            { status: 'CLEAR', color: '#00ff88', details: 'Route is clear. Optimal traffic flow.' },
            { status: 'ROADWORKS', color: '#ffcc00', details: 'Minor delays due to active road maintenance ahead.' },
            { status: 'ACCIDENT', color: '#ff3333', details: 'Collision detected on route. Traffic is building up.' },
            { status: 'HEAVY TRAFFIC', color: '#ff9900', details: 'High volume of vehicles. Expect slower speeds.' },
            { status: 'POOR WEATHER', color: '#00ccff', details: 'Wet conditions. Reduce speed and maintain following distance.' }
        ];
        if (route.distance < 2000 && Math.random() > 0.2)
            return conditions[0];
        const randomIdx = Math.floor(Math.random() * conditions.length);
        return conditions[randomIdx];
    }
    async finalizeRouting(type) {
        if (!this.currentOriginCoords || !this.currentDestCoords)
            return;
        if (this.routingAbortController)
            this.routingAbortController.abort();
        this.routingAbortController = new AbortController();
        const profile = transportModes_1.TRANSPORT_PROFILES[type].mapboxProfile;
        try {
            const reasoning = document.getElementById('loader-status');
            if (reasoning)
                reasoning.innerText = `AI Assistant: Analyzing route conditions...`;
            const route = await this.routeOptimizer.fetchAndOptimizeRoute(this.currentOriginCoords, this.currentDestCoords, profile, this.routingAbortController.signal);
            if (route) {
                this.pendingRoute = route;
                const etaEl = document.getElementById('nav-eta-time');
                const distEl = document.getElementById('nav-distance');
                const arrivalEl = document.getElementById('nav-arrival');
                if (etaEl)
                    etaEl.innerText = this.formatDuration(route.duration);
                if (distEl)
                    distEl.innerText = `${(route.distance / 1000).toFixed(1)} km`;
                if (arrivalEl) {
                    const arrivalTime = new Date(Date.now() + route.duration * 1000);
                    arrivalEl.innerText = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                const condition = this.simulateRouteCondition(route);
                const statusEl = document.getElementById('route-condition-status');
                const detailsEl = document.getElementById('route-condition-details');
                if (statusEl) {
                    statusEl.innerText = condition.status;
                    statusEl.style.color = condition.color;
                }
                if (detailsEl)
                    detailsEl.innerText = condition.details;
                document.getElementById('preview-eta').innerText = this.formatDuration(route.duration);
                document.getElementById('preview-distance').innerText = `${(route.distance / 1000).toFixed(1)} km`;
                document.getElementById('route-preview-panel').style.display = 'flex';
                if (reasoning)
                    reasoning.innerText = `AI Assistant: Route analyzed. Awaiting confirmation.`;
                if (this.map.visualEffects)
                    this.map.visualEffects.drawRoute(route.coordinates);
                if (this.map.cameraController)
                    this.map.cameraController.setMode('OVERVIEW');
            }
        }
        catch (e) {
            if (e.name !== 'AbortError')
                console.error('Routing fail:', e);
        }
    }
    startNavigation(route) {
        this.tripStartTime = Date.now();
        this.tripTotalDistance = route.distance;
        this.navSystem.start(route, transportModes_1.TRANSPORT_PROFILES[this.currentTransportType].mapboxProfile);
        document.getElementById('maneuver-card').style.display = 'flex';
        document.getElementById('nav-bottom-bar').style.display = 'flex';
        document.getElementById('recenter-btn').style.display = 'flex';
        document.getElementById('perspective-toggle').style.display = 'flex';
        const topControls = document.querySelector('.top-controls');
        if (topControls)
            topControls.style.display = 'none';
        if (this.map.visualEffects) {
            this.map.visualEffects.setNavigating(true);
        }
        const intelDropdown = document.querySelector('.dropdown-container');
        if (intelDropdown)
            intelDropdown.style.display = 'flex';
        const briefing = intelligenceManager_1.intelligence.generateTacticalBriefing(route, this.currentTransportType);
        this.showTacticalNotification(briefing.brief);
        this.speakBriefing(briefing.brief);
        const hazardFab = document.getElementById('hazard-fab');
        if (hazardFab)
            hazardFab.style.display = 'flex';
        this.navSystem.onOffRoute = () => {
            this.speakBriefing("Recalculating route.");
            this.finalizeRouting(this.currentTransportType);
        };
    }
    reportHazard(type) {
        if (!(0, auth_1.isAuthenticated)()) {
            this.showLockMessage('Sign in to unlock live tactical intelligence and community-powered road updates.');
            return;
        }
        if (!this.currentOriginCoords)
            return;
        const pos = this.navSystem.getCurrentPosition() || this.currentOriginCoords;
        intelligenceManager_1.intelligence.report({
            type: 'HAZARD',
            payload: { type, location: pos },
            timestamp: Date.now()
        });
        this.speakBriefing(`Reporting ${type} at current location.`);
    }
    stopNavigation() {
        this.navSystem.stop();
        this.map.exitNavigationMode();
        this.map.visualEffects.clearRoute();
        document.getElementById('search-view').style.display = 'flex';
        document.getElementById('nav-bottom-bar').style.display = 'none';
        document.getElementById('recenter-btn').style.display = 'none';
        const perspectiveToggle = document.getElementById('perspective-toggle');
        if (perspectiveToggle) {
            perspectiveToggle.style.display = 'none';
            perspectiveToggle.innerText = '2D';
        }
        document.getElementById('maneuver-card').style.display = 'none';
        document.getElementById('hazard-fab').style.display = 'none';
        const topControls = document.querySelector('.top-controls');
        if (topControls)
            topControls.style.display = 'flex';
        if (this.map.visualEffects) {
            this.map.visualEffects.setNavigating(false);
        }
        this.showTripSummary();
    }
    showTripSummary() {
        const durationMs = Date.now() - this.tripStartTime;
        const durationMins = Math.floor(durationMs / 60000);
        const avgSpeed = (this.tripTotalDistance / (durationMs / 3600000)).toFixed(1);
        document.getElementById('sum-dist').innerText = `${(this.tripTotalDistance / 1000).toFixed(1)} km`;
        document.getElementById('sum-time').innerText = `${durationMins} min`;
        document.getElementById('sum-avg-speed').innerText = `${avgSpeed} km/h`;
        document.getElementById('summary-modal').style.display = 'block';
    }
    closeSummary() {
        document.getElementById('summary-modal').style.display = 'none';
    }
    speakBriefing(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 0.85;
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    }
    updateAuthUI() {
        const badge = document.getElementById('guest-badge');
        const loginBtn = document.getElementById('login-btn');
        if (this.authState === auth_1.AuthState.Authenticated) {
            if (badge)
                badge.style.display = 'none';
            if (loginBtn)
                loginBtn.innerText = '👤 Logout';
        }
        else {
            if (badge)
                badge.style.display = 'block';
            if (loginBtn)
                loginBtn.innerText = '👤 Login / Sign In';
        }
    }
    showLockMessage(message) {
        this.showTacticalNotification(message);
    }
    setupNavigationStateListener() {
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
                if (etaEl)
                    etaEl.innerText = this.formatDuration(remainingSeconds);
                if (distEl)
                    distEl.innerText = `${(state.totalDistanceRemaining / 1000).toFixed(1)} km`;
                if (arrivalEl) {
                    const arrivalTime = new Date(Date.now() + remainingSeconds * 1000);
                    arrivalEl.innerText = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                const card = document.getElementById('maneuver-card');
                if (card && state.isMoving) {
                    card.style.display = 'flex';
                    const maneuverDistEl = document.getElementById('maneuver-dist');
                    if (maneuverDistEl)
                        maneuverDistEl.innerText = `${Math.round(state.distanceToNext)} m`;
                    const route = this.navSystem.route;
                    if (route && route.steps) {
                        const currentStep = route.steps[this.navSystem.currentStepIndex];
                        if (currentStep) {
                            const instrEl = document.getElementById('maneuver-instruction');
                            const iconEl = document.getElementById('maneuver-icon');
                            if (instrEl)
                                instrEl.innerText = currentStep.maneuver.instruction;
                            if (iconEl)
                                iconEl.innerText = this.getManeuverIcon(currentStep.maneuver.type);
                        }
                    }
                }
            }
        };
    }
    getManeuverIcon(type) {
        const icons = {
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
            if (type.toLowerCase().includes(key))
                return icons[key];
        }
        return '↑';
    }
    getCategoryIcon(category) {
        const icons = {
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
    getOverpassQuery(category) {
        const map = {
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
    calculateDistanceKM(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    async filterUrbanIntelligence(category) {
        const center = this.map.map.getCenter();
        const origin = this.currentOriginCoords || [center.lng, center.lat];
        const statusText = document.getElementById('loader-status');
        const startupLoader = document.getElementById('startup-loader');
        if (startupLoader && statusText) {
            startupLoader.style.display = 'flex';
            startupLoader.style.background = 'rgba(0,0,0,0.4)';
            statusText.innerText = `SCANNING SECTOR FOR: ${category.toUpperCase()}...`;
        }
        try {
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
            const overpassTag = this.getOverpassQuery(category);
            const query = `[out:json][timeout:5];(node(around:2500,${origin[1]},${origin[0]})[${overpassTag}];way(around:2500,${origin[1]},${origin[0]})[${overpassTag}];);out center;`;
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
                body: 'data=' + encodeURIComponent(query)
            });
            if (!response.ok)
                throw new Error(`POI Server overloaded`);
            const textData = await response.text();
            const data = JSON.parse(textData);
            let validFeatures = (data.elements || [])
                .filter((e) => e.tags && e.tags.name)
                .map((e) => {
                const lat = e.center?.lat || e.lat;
                const lon = e.center?.lon || e.lon;
                const street = e.tags['addr:street'] || '';
                const city = e.tags['addr:city'] || '';
                let place_name = e.tags.name;
                if (street && city)
                    place_name += `, ${street}, ${city}`;
                else if (street)
                    place_name += `, ${street}`;
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
                const sorted = validFeatures.map((f) => {
                    const [lng, lat] = f.center;
                    const distKm = this.calculateDistanceKM(origin[1], origin[0], lat, lng);
                    return { ...f, distKm, etaMins: Math.max(1, Math.round((distKm / 40) * 60)) };
                }).sort((a, b) => a.distKm - b.distKm).slice(0, 5);
                const renderUI = (fastestIdx) => {
                    const container = document.getElementById('intel-results-container');
                    if (!container)
                        return;
                    let html = `
            <div class="intel-close-panel-btn" onclick="document.getElementById('intel-results-container').style.display='none'">✖</div>
          `;
                    sorted.forEach((feature, index) => {
                        const [lng, lat] = feature.center;
                        const isWinner = (index === fastestIdx);
                        const badge = isWinner ? `<div style="background:var(--success); color:#000; font-size:0.6rem; padding:2px 5px; border-radius:4px; font-weight:bold;">FASTEST</div>` : '';
                        const borderColor = isWinner ? 'var(--success)' : 'var(--primary-accent)';
                        if (!feature.markerAdded) {
                            this.map.addTacticalMarker({
                                id: `intel-${category}-${index}`,
                                type: 'Urban Node',
                                location: [lng, lat],
                                severity: isWinner ? 'warning' : 'info',
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
                renderUI(0);
                if (startupLoader) {
                    startupLoader.style.display = 'none';
                }
                this.showTacticalNotification(`FOUND ${sorted.length} LOCATIONS. REFINING ROUTES...`);
                const candidates = sorted.slice(0, 3);
                const routePromises = candidates.map(async (feature) => {
                    try {
                        const dest = feature.center;
                        const route = await this.routeOptimizer.fetchAndOptimizeRoute(origin, dest, 'driving-traffic', new AbortController().signal);
                        return { feature, route };
                    }
                    catch (e) {
                        return { feature, route: null };
                    }
                });
                Promise.all(routePromises).then(routeResults => {
                    let fastestIndex = 0;
                    let shortestDuration = Infinity;
                    routeResults.forEach((res, i) => {
                        if (res.route && res.route.duration < shortestDuration) {
                            shortestDuration = res.route.duration;
                            fastestIndex = i;
                        }
                        const originalIndex = sorted.findIndex((f) => f.id === res.feature.id);
                        if (originalIndex !== -1) {
                            sorted[originalIndex].exactRoute = res.route;
                            if (res.route) {
                                sorted[originalIndex].distKm = res.route.distance / 1000;
                                sorted[originalIndex].etaMins = Math.ceil(res.route.duration / 60);
                            }
                        }
                    });
                    renderUI(fastestIndex);
                    this.showTacticalNotification(`ROUTES REFINED. FASTEST: ${sorted[fastestIndex].text.toUpperCase()}`);
                }).catch(console.error);
            }
            else {
                if (startupLoader)
                    startupLoader.style.display = 'none';
                this.showTacticalNotification(`NO RESULTS FOUND NEARBY`);
                const container = document.getElementById('intel-results-container');
                if (container)
                    container.style.display = 'none';
            }
        }
        catch (err) {
            if (startupLoader)
                startupLoader.style.display = 'none';
            const container = document.getElementById('intel-results-container');
            if (container)
                container.style.display = 'none';
            console.error('Tactical failure: POI scan failed', err);
            this.showTacticalNotification(`SCAN FAILED: ${err.message?.toUpperCase() || 'SERVER TIMEOUT'}`);
        }
    }
    showTacticalNotification(message) {
        const feed = document.getElementById('intel-feed');
        if (!feed)
            return;
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
    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0)
            return `${hrs}h ${mins}m`;
        return `${mins} min`;
    }
}
window.app = new App();
window.startIntelNavigation = (lng, lat, name) => {
    const destInput = document.getElementById('dest-input');
    if (destInput) {
        destInput.value = name;
    }
    if (window.app) {
        window.app.handleGeocodingSelection(name, [lng, lat], 'destination');
        const container = document.getElementById('intel-results-container');
        if (container)
            container.style.display = 'none';
    }
};
//# sourceMappingURL=main.client.js.map