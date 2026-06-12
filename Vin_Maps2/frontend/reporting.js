// frontend/reporting.js
// Simple incident reporting UI with a floating button and modal.
// Sends a POST request to /api/report with {type, description, lng, lat}.

(function () {
  // Create floating button
  const btn = document.createElement('button');
  btn.id = 'report-btn';
  btn.textContent = 'Report Incident';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '1001';
  btn.style.padding = '10px 15px';
  btn.style.background = 'rgba(255,0,0,0.8)';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  document.body.appendChild(btn);

  // Create modal container (hidden by default)
  const modal = document.createElement('div');
  modal.id = 'report-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'none';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  document.body.appendChild(modal);

  // Modal content
  const content = document.createElement('div');
  content.style.background = '#fff';
  content.style.padding = '20px';
  content.style.borderRadius = '8px';
  content.style.width = '300px';
  content.innerHTML = `
    <h3 style="margin-top:0;">Report Incident</h3>
    <label>Type:<br><select id="report-type"><option value="ACCIDENT">Accident</option><option value="ROADWORK">Roadwork</option><option value="HAZARD">Hazard</option></select></label><br><br>
    <label>Description:<br><textarea id="report-desc" rows="4" style="width:100%;"></textarea></label><br><br>
    <label>Longitude:<br><input id="report-lng" type="number" step="any" style="width:100%;"/></label><br><br>
    <label>Latitude:<br><input id="report-lat" type="number" step="any" style="width:100%;"/></label><br><br>
    <button id="report-submit" style="margin-right:10px;">Submit</button>
    <button id="report-cancel">Cancel</button>
  `;
  modal.appendChild(content);

  // Open modal on button click
  btn.addEventListener('click', () => {
    // Reset fields
    const typeEl = document.getElementById('report-type');
    if (typeEl) typeEl.value = 'ACCIDENT';
    const descEl = document.getElementById('report-desc');
    if (descEl) descEl.value = '';
    const lngEl = document.getElementById('report-lng');
    if (lngEl) lngEl.value = '';
    const latEl = document.getElementById('report-lat');
    if (latEl) latEl.value = '';
    modal.style.display = 'flex';
  });

  // Cancel button
  const cancelBtn = document.getElementById('report-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Submit handler
  const submitBtn = document.getElementById('report-submit');
  if (submitBtn) submitBtn.addEventListener('click', async () => {
    const type = document.getElementById('report-type')?.value ?? '';
    const description = document.getElementById('report-desc')?.value ?? '';
    const lng = parseFloat(document.getElementById('report-lng')?.value ?? '0');
    const lat = parseFloat(document.getElementById('report-lat')?.value ?? '0');
    if (!description || isNaN(lng) || isNaN(lat)) {
      alert('Please fill all fields.');
      return;
    }
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, lng, lat })
      });
      if (res.ok) {
        alert('Report submitted successfully');
        modal.style.display = 'none';
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'unknown'));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to submit report');
    }
  });
})();
