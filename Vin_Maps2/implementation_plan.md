# Multi‑Stop Trip Planning Implementation

## Goal Description
Implement a full multi‑stop trip planning UI panel that allows users to add, remove, and reorder stop points, and request route optimization with dynamic ETA updates. Integrate the UI with the existing backend `fetchAndOptimizeMultiStopRoute` endpoint and update the map display accordingly.

## User Review Required
> [!IMPORTANT]
> Review the proposed UI layout, design aesthetics, and interaction flow. Confirm if the stop list should support drag‑and‑drop reordering or simple up/down buttons. Also confirm any additional data (e.g., custom names for stops) you want displayed.

## Open Questions
> [!WARNING]
> - Should the stop list allow naming each stop (e.g., "Home", "Work")? If so, we need extra fields.
> - Preferred method for reordering stops: drag‑and‑drop library or simple up/down arrows?
> - Do you want the ETA to update in real‑time as stops are added/removed, or only after clicking a "Calculate" button?

## Proposed Changes
---
### Frontend UI (frontend/index.html & frontend/main.js)
- Add a new `<aside>` panel titled "Trip Planner" with input fields for origin, destination, and a dynamic list of stops.
- Provide "Add Stop" button to append a new stop input row.
- Each stop row includes a text input, a remove (✖) button, and up/down arrows for ordering.
- Include a "Calculate Route" button that gathers all points and sends a POST request to `/api/route` with `origin`, `destination`, `stops`, and optional `avoid`/`profile`.
- Display total distance, ETA, and per‑leg details in the panel.
- Use existing map interaction utilities to draw the returned route geometry.

### Frontend Logic (frontend/main.js)
- Implement functions `addStopRow()`, `removeStop(row)`, `moveStop(row, direction)`.
- Collect values from inputs, validate coordinates (use geocoding service if needed), and call `fetch('/api/route', {method:'POST', body:JSON.stringify(payload)})`.
- Parse response GeoJSON, compute total duration and distance, and update UI.
- Hook into existing map engine to render the route via `mapEngine.addRouteLayer(geojson)`.
- Apply glassmorphism styling consistent with existing panels.

### Backend Integration (backend/src/routes/routeRouter.ts)
- Ensure the POST handler already accepts `stops` array and forwards to `fetchAndOptimizeMultiStopRoute` (already added).
- No further changes needed unless additional query params are required.

### Styling (frontend/style.css)
- Add CSS rules for the new trip planner panel, inputs, buttons, and stop list items with modern aesthetics (glass effect, subtle hover animations, smooth transitions).

## Verification Plan
### Automated Tests
- Run `npm run dev` and open the app.
- Use the UI to add 2‑3 stops, calculate route, and verify the map displays a polyline covering all points.
- Check that total ETA matches the sum of leg durations returned by the backend.

### Manual Verification
- Manually test adding, removing, and reordering stops and ensure the route updates correctly.
- Verify UI remains responsive on different screen sizes.

