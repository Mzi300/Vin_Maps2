// main.js – bootstraps the VinMaps UI
// 1. Theme (Night/Day) toggle
// 2. MapEngine initialization
// 3. Simple example of using the map engine (fly to a default location)

// --- Theme toggle ------------------------------------------------------
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    // Persist preference in localStorage
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('vinmaps-theme', isDark ? 'dark' : 'light');
  });
}

// Restore saved theme on load
const savedTheme = localStorage.getItem('vinmaps-theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
}

// --- MapEngine --------------------------------------------------------
let mapEngine;
// Helper to re‑enable interactions after map ready or resize
function resetMapInteractions() {
  if (!mapEngine) return;
  mapEngine.map.dragPan.enable();
  mapEngine.map.scrollZoom.enable();
  console.log('Map interactions reset');
}
window.addEventListener('load', () => {
  // Initialize the map once the DOM and MapLibre script are ready
  mapEngine = new MapEngine('map');

  // Ensure map knows its container size (important after CSS changes)
  mapEngine.map.resize();

  // Re‑enable interactions after initial load
  resetMapInteractions();
  // Day/Night map toggle
  let isDarkMap = false;
  const dayNightBtn = document.getElementById('day-night-toggle');
  if (dayNightBtn) {
    dayNightBtn.addEventListener('click', () => {
      const lightStyle = 'https://demotiles.maplibre.org/style.json';
      const darkStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
      const newStyle = isDarkMap ? lightStyle : darkStyle;
      mapEngine.map.setStyle(newStyle);
      isDarkMap = !isDarkMap;
    });
    // Re‑enable interactions after style change
    mapEngine.map.on('styledata', () => {
      mapEngine.map.dragPan.enable();
      mapEngine.map.scrollZoom.enable();
    });
  }
  // Keep exploreFeatures in sync with all map sources
  function rebuildExploreFeatures() {
    const combined = [];
    const poisSrc = mapEngine.map.getSource('pois');
    if (poisSrc && poisSrc._data) combined.push(...poisSrc._data.features);
    const clustersSrc = mapEngine.map.getSource('clusters');
    if (clustersSrc && clustersSrc._data) combined.push(...clustersSrc._data.features);
    const routeSrc = mapEngine.map.getSource('route');
    if (routeSrc && routeSrc._data) combined.push(...routeSrc._data.features);
    // Assign stable ids if missing
    combined.forEach((f, i) => { if (f.id === undefined) f.id = i; });
    exploreFeatures = combined;
  }
  // Refresh explore list when map sources change
  mapEngine.on('onPoiSourceAdded', rebuildExploreFeatures);
  mapEngine.on('onClusterAdded', rebuildExploreFeatures);
  mapEngine.on('onRouteCalculated', rebuildExploreFeatures);

  // Global collection for explore panel
  let exploreFeatures = [];

  // Fly to default location after map is ready and load POIs
  mapEngine.on('onMapReady', async () => {
    mapEngine.flyTo([28.0473, -26.2041], 12); // lon, lat, zoom
    resetMapInteractions(); // ensure interactions are active
    // Load POIs (landmarks) for current viewport
    let allPois = null;
    const loadPOIs = async () => {
      const bounds = mapEngine.map.getBounds();
      const zoom = Math.round(mapEngine.map.getZoom());
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
      const url = `http://localhost:3000/api/pois/cluster?z=${zoom}&bbox=${bbox.join(',')}`;
      try {
        const res = await fetch(url, { headers: { 'x-api-key': 'MrQr5OnYjebZqtvrelvXolJfMHxt4TYq' } });
        if (!res.ok) throw new Error('Failed to fetch POIs');
        const geojson = await res.json();

        // Assign stable ids to features for list navigation
        geojson.features.forEach((f, i) => { f.id = i; });
        allPois = geojson;
        exploreFeatures = geojson.features.slice();
        mapEngine.addPoiSource(geojson);
        populateExploreList();
      } catch (e) { console.error('POI load error', e); }
    };
    await loadPOIs();
    // Reload POIs on move end to keep data fresh
    mapEngine.map.on('moveend', loadPOIs);
    // Popup on POI click
    mapEngine.map.on('click', 'pois-symbol', (e) => {
      const props = e.features[0].properties;
      new maplibregl.Popup({ closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${props.name || 'Landmark'}</strong>`)
        .addTo(mapEngine.map);
    });
    // Search filter for POIs (landmark-search)
    const landmarkSearch = document.getElementById('landmark-search');
    if (landmarkSearch) {
      let timeout;
      landmarkSearch.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const term = e.target.value.trim().toLowerCase();
        timeout = setTimeout(() => {
          if (!allPois) return;
          const filtered = term
            ? { type: 'FeatureCollection', features: allPois.features.filter(f => (f.properties.name || '').toLowerCase().includes(term)) }
            : allPois;
          mapEngine.map.getSource('pois').setData(filtered);
          exploreFeatures = filtered.features.slice();
          populateExploreList();
        }, 300);
      });
    }
    // Explore panel search (search all features)
    const exploreSearch = document.getElementById('explore-search');
    if (exploreSearch) {
      let timeout;
      exploreSearch.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const term = e.target.value.trim().toLowerCase();
        timeout = setTimeout(() => {
          const filtered = term
            ? exploreFeatures.filter(f => (f.properties.name || '').toLowerCase().includes(term))
            : exploreFeatures;
          // Update map source for POIs only (if present)
          if (mapEngine.map.getSource('pois')) {
            mapEngine.map.getSource('pois').setData({ type: 'FeatureCollection', features: filtered.filter(f => f.geometry.type === 'Point') });
          }
          populateExploreList(filtered);
        }, 300);
      });
    }
    // Click handler for list items
    const exploreList = document.getElementById('explore-list');
    if (exploreList) {
      exploreList.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-id]');
        if (!li) return;
        const fid = Number(li.getAttribute('data-id'));
        const feature = exploreFeatures.find(f => f.id === fid);
        if (feature) {
          const center = mapEngine.getFeatureCenter(feature);
          mapEngine.flyTo(center, 15);
        }
      });
    }
  });

  // Function to populate the explore list UI
  function populateExploreList(list = exploreFeatures) {
    const ul = document.getElementById('explore-list');
    if (!ul) return;
    ul.innerHTML = '';
    list.forEach(f => {
      const name = f.properties.name || 'Unnamed';
      const li = document.createElement('li');
      li.textContent = name;
      li.setAttribute('data-id', f.id);
      li.style.padding = '4px 6px';
      li.style.cursor = 'pointer';
      li.style.borderBottom = '1px solid var(--glass-border)';
      ul.appendChild(li);
    });
  }

  // ---- Trip Planner Logic ----
  const stopsContainer = document.getElementById('stops-container');
  const addStopBtn = document.getElementById('add-stop-btn');
  const calcRouteBtn = document.getElementById('calc-route-btn');
  const tripInfoDiv = document.getElementById('trip-info');

  function createStopRow(index = 0) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginBottom = '0.3rem';
    row.dataset.idx = index;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mini-input';
    input.placeholder = 'Stop (lon,lat)';
    input.style.flex = '1';
    input.style.marginRight = '0.3rem';
    const upBtn = document.createElement('button');
    upBtn.textContent = '↑';
    upBtn.className = 'cat-btn';
    upBtn.style.padding = '0 0.3rem';
    const downBtn = document.createElement('button');
    downBtn.textContent = '↓';
    downBtn.className = 'cat-btn';
    downBtn.style.padding = '0 0.3rem';
    const delBtn = document.createElement('button');
    delBtn.textContent = '✖';
    delBtn.className = 'cat-btn';
    delBtn.style.padding = '0 0.3rem';

    upBtn.onclick = () => moveStop(row, -1);
    downBtn.onclick = () => moveStop(row, 1);
    delBtn.onclick = () => row.remove();

    row.appendChild(input);
    row.appendChild(upBtn);
    row.appendChild(downBtn);
    row.appendChild(delBtn);
    return row;
  }

  function moveStop(row, direction) {
    const sibling = direction === -1 ? row.previousElementSibling : row.nextElementSibling;
    if (sibling) {
      stopsContainer.insertBefore(row, direction === -1 ? sibling : sibling.nextElementSibling);
    }
  }

  addStopBtn.onclick = () => {
    const newRow = createStopRow();
    stopsContainer.appendChild(newRow);
  };

  async function calculateRoute() {
    const originVal = document.getElementById('origin-input').value.trim();
    const destVal = document.getElementById('destination-input').value.trim();
    if (!originVal || !destVal) {
      tripInfoDiv.textContent = 'Please enter origin and destination.';
      return;
    }
    const origin = originVal.split(',').map(Number);
    const destination = destVal.split(',').map(Number);
    const stopInputs = stopsContainer.querySelectorAll('input');
    const stops = [];
    for (const inp of stopInputs) {
      const val = inp.value.trim();
      if (val) {
        const pt = val.split(',').map(Number);
        if (pt.length === 2 && !pt.some(isNaN)) stops.push(pt);
      }
    }
    const payload = { origin, destination, stops };
    try {
      const res = await fetch('http://localhost:3000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Route request failed');
      const geo = await res.json();
      if (window.mapEngine && typeof window.mapEngine.addRouteLayer === 'function') {
        window.mapEngine.addRouteLayer(geo);
      }
      const totalDuration = geo.features[0].properties.duration;
      const totalDistance = geo.features[0].properties.distance;
      const mins = Math.round(totalDuration / 60);
      const km = (totalDistance / 1000).toFixed(1);
      tripInfoDiv.textContent = `Trip: ${km} km • ETA: ${mins} min`;
    } catch (e) {
      console.error(e);
      tripInfoDiv.textContent = 'Error calculating route.';
    }
  }

  calcRouteBtn.onclick = calculateRoute;

  // Update map size on window resize and re‑enable interactions
  window.addEventListener('resize', () => {
    mapEngine.map.resize();
    resetMapInteractions();
  });

  // Example listeners – you can replace these with Redux dispatches later
  mapEngine.on('onCameraMove', (cam) => {
    console.log('Camera moved', cam);
  });
  mapEngine.on('onMapClick', (e) => {
    console.log('Map click', e.lngLat);
    // In a full app you would query POI near this point, show popup, etc.
  });
});
