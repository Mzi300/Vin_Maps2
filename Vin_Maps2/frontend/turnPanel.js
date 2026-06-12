// frontend/turnPanel.js
// Turn‑by‑turn panel with lane guidance and road‑level instructions.
// Exposes two globals:
//   renderTurnPanel(steps) – initial rendering of the full list.
//   updateTurnPanel(steps, currentIdx) – updates the list and highlights the active step.

function renderTurnPanel(steps) {
  const container = getOrCreateContainer();
  container.innerHTML = '';
  const title = document.createElement('div');
  title.textContent = 'Turn‑by‑Turn';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '8px';
  container.appendChild(title);

  const list = document.createElement('ol');
  list.style.paddingLeft = '20px';
  steps.forEach((step, idx) => {
    const li = document.createElement('li');
    li.textContent = `${step.instruction || 'Continue'}${step.name ? ' onto ' + step.name : ''} (${(step.distance / 1000).toFixed(2)} km)`;
    li.style.marginBottom = '4px';
    li.dataset.idx = idx;
    // Append lane guidance if available
    const laneInfo = renderLaneInfo(step);
    if (laneInfo) li.appendChild(laneInfo);
    list.appendChild(li);
  });
  container.appendChild(list);
}

function updateTurnPanel(steps, currentIdx) {
  const container = getOrCreateContainer();
  container.innerHTML = '';
  const title = document.createElement('div');
  title.textContent = 'Turn‑by‑Turn';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '8px';
  container.appendChild(title);

  const list = document.createElement('ol');
  list.style.paddingLeft = '20px';
  steps.forEach((step, idx) => {
    const li = document.createElement('li');
    li.textContent = `${step.instruction || 'Continue'}${step.name ? ' onto ' + step.name : ''} (${(step.distance / 1000).toFixed(2)} km)`;
    li.style.marginBottom = '4px';
    li.dataset.idx = idx;
    if (idx === currentIdx) {
      li.style.fontWeight = 'bold';
      li.style.color = '#00ff99';
    }
    const laneInfo = renderLaneInfo(step);
    if (laneInfo) li.appendChild(laneInfo);
    list.appendChild(li);
  });
  container.appendChild(list);
}

// Helper to create a small lane guidance element.
function renderLaneInfo(step) {
  // Mapbox style: step.intersections[0].lanes array with .valid and .indication fields.
  if (!step.intersections) return null;
  const firstIntersection = step.intersections[0];
  if (!firstIntersection || !firstIntersection.lanes) return null;
  const laneDiv = document.createElement('div');
  laneDiv.style.display = 'flex';
  laneDiv.style.gap = '4px';
  laneDiv.style.marginTop = '4px';
  laneDiv.style.fontSize = '0.85em';

  // Helper to map indication strings to Unicode arrows.
  const indicationMap = {
    left: '←',
    right: '→',
    straight: '↑',
    slight_left: '↖',
    slight_right: '↗',
    sharp_left: '↙',
    sharp_right: '↘',
    uturn: '⮐',
    merge_to_left: '↙↔',
    merge_to_right: '↘↔',
    none: '',
  };

  firstIntersection.lanes.forEach((lane) => {
    const span = document.createElement('span');
    // Prefer indication arrow; fallback to checkmark.
    const indication = lane.indication && lane.indication[0] ? lane.indication[0] : null;
    if (indication && indicationMap[indication]) {
      span.textContent = indicationMap[indication];
    } else {
      span.textContent = lane.valid ? '✔' : '✖';
    }
    span.title = lane.valid ? 'Valid lane' : 'Invalid lane';
    span.style.opacity = lane.valid ? '1' : '0.4';
    laneDiv.appendChild(span);
  });
  return laneDiv;
}

function getOrCreateContainer() {
  let container = document.getElementById('turn-panel');
  if (!container) {
    container = document.createElement('div');
    container.id = 'turn-panel';
    container.style.position = 'absolute';
    container.style.bottom = '80px';
    container.style.right = '10px';
    container.style.width = '260px';
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
    container.style.background = 'rgba(0,0,0,0.6)';
    container.style.backdropFilter = 'blur(8px)';
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.color = '#fff';
    container.style.fontFamily = 'Inter, sans-serif';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
  }
  return container;
}

// Expose globally for the app to call.
window.renderTurnPanel = renderTurnPanel;
window.updateTurnPanel = updateTurnPanel;
