import type { OptimizedRoute } from './routeOptimizer';
import { systemMonitor } from './systemMonitor';

export interface NavState {
  currentPosition: [number, number];
  heading: number;
  compassDirection: string;
  speed: number;
  nextStep?: any;
  distanceToNext: number;
  totalDistanceRemaining: number;
  isMoving: boolean;
}

export class RealtimeService {
  private socket: any;

  constructor() {
    this.initSocket();
  }

  public reportHazard(type: string, location: [number, number]) {
    if (this.socket) {
      this.socket.emit('hazard_report', { type, location });
    }
  }

  public triggerSOS(location: [number, number]) {
    if (this.socket) {
      this.socket.emit('sos_trigger', { location });
    }
  }

  private initSocket() {
    // Placeholder for socket init
  }
}

export class NavigationSystem {
  private route: OptimizedRoute | null = null;
  private watchId: number | null = null;
  private lastPosition: [number, number] | null = null;
  private lastTime: number = 0;
  private lastOrientationTime: number = 0;
  
  // Dynamic parameters based on profile
  private speedThreshold: number = 0.05; // Reduced from 0.2m/s
  private smoothingFactor: number = 0.2; // Smoother movement (Reduced from 0.35)
  private minZoom: number = 15.5;
  private maxZoom: number = 18.5;
  
  public currentStepIndex: number = 0;
  private voiceQueue: string[] = [];
  private isSpeaking: boolean = false;
  private offRouteThreshold: number = 100; // meters (more generous to allow for GPS jitter)
  
  private currentState: NavState = {
    currentPosition: [0, 0],
    heading: 0,
    compassDirection: 'North',
    speed: 0,
    distanceToNext: 0,
    totalDistanceRemaining: 0,
    isMoving: false
  };

  private gpsTraceBuffer: [number, number][] = [];
  private lastMapMatchTime: number = 0;
  private readonly MAPBOX_TOKEN = import.meta.env?.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibXppa2F5aXNlMDEiLCJhIjoiY21vczd4ajc4MDA5ODJ3c2R3NDV2dHI0NSJ9.gbvq-aQiEttYKka8u4qmqg';

  private hasDetectedMotion: boolean = false;
  private headingBuffer: number[] = [];
  private readonly HEADING_BUFFER_SIZE = 15;

  public onUpdate?: (state: NavState) => void;
  public onStepChange?: (step: any) => void;
  public onOffRoute?: () => void;
  public onProactiveAlert?: (type: string, dist: number) => void;

  private announcedHazards: Set<string> = new Set();

  public snapToPosition(pos: [number, number], heading: number) {
    this.hasDetectedMotion = false; // Reset gate
    this.currentState = {
      currentPosition: pos,
      heading: heading,
      compassDirection: this.calculateCompassDirection(heading),
      speed: 0,
      distanceToNext: 0,
      totalDistanceRemaining: 0,
      isMoving: false
    };
    this.lastPosition = pos;
    this.lastTime = performance.now();
    if (this.onUpdate) this.onUpdate(this.currentState);
  }
  public start(route: OptimizedRoute, profile: string = 'driving') {
    this.hasDetectedMotion = false; // Reset gate
    this.route = route;
    this.currentStepIndex = 0;
    this.configureProfile(profile);
    
    // 1. AI Voice: Pre-Mission Briefing
    this.generatePreMissionBriefing(route);
    
    this.startTracking();
  }

  public silentRestart(route: OptimizedRoute) {
    this.route = route;
    this.currentStepIndex = 0;
    this.speak("Recalculating route.");
  }

  private generatePreMissionBriefing(route: OptimizedRoute) {
    const intel = route.hazardsSummary;
    if (!intel || intel.score >= 95) {
      this.speak("Route analysis complete. Tactical conditions optimal. Proceed with caution.");
      return;
    }

    let briefing = `Tactical Safety Index is ${intel.score}. `;
    if (intel.potholes > 0) briefing += `Caution: ${intel.potholes} pothole clusters detected. `;
    if (intel.criticalHazards > 0) briefing += `Alert: ${intel.criticalHazards} critical roadblocks identified on path. `;
    briefing += "Adjusting mobility parameters for high-alert mode.";
    
    this.speak(briefing);
  }

  public startTracking() {
    if (this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => {
        console.error('[NavigationSystem] GPS_SIGNAL_LOST:', err.message);
        // Fallback or warning logic
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    // 2. COMPASS / ORIENTATION TRACKING
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', (e) => this.handleOrientationUpdate(e), true);
      window.addEventListener('deviceorientation', (e) => this.handleOrientationUpdate(e), true);
    }
  }

  private getAverageHeading(newHeading: number): number {
    this.headingBuffer.push(newHeading);
    if (this.headingBuffer.length > this.HEADING_BUFFER_SIZE) {
      this.headingBuffer.shift();
    }
    
    let sumSin = 0;
    let sumCos = 0;
    for (const h of this.headingBuffer) {
      const rad = (h * Math.PI) / 180;
      sumSin += Math.sin(rad);
      sumCos += Math.cos(rad);
    }
    
    const avgRad = Math.atan2(sumSin, sumCos);
    let avgDeg = (avgRad * 180) / Math.PI;
    if (avgDeg < 0) avgDeg += 360;
    return avgDeg;
  }

  private handleOrientationUpdate(e: DeviceOrientationEvent) {
    if (this.currentState.speed > 1.0) return; // Use GPS heading above 1.0 m/s

    // Throttle orientation updates to max 15Hz (66ms) to prevent UI thread blockage from high-frequency sensor ticks
    const now = performance.now();
    if (now - this.lastOrientationTime < 66) return;
    this.lastOrientationTime = now;

    let heading = 0;
    if ((e as any).webkitCompassHeading) {
      heading = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null) {
      // For Android/Chrome absolute orientation
      heading = 360 - e.alpha;
    } else {
      return;
    }

    // Apply angular rolling average to smooth raw device orientation changes
    const smoothedHeading = this.getAverageHeading(heading);
    
    // Standstill compass behavior: use a wider noise gate (5 deg) while stationary to prevent jitter/spinning
    const isStopped = this.currentState.speed < 0.1 || !this.currentState.isMoving;
    const noiseGate = isStopped ? 5.0 : 2.0;

    let diff = smoothedHeading - this.currentState.heading;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    if (Math.abs(diff) > noiseGate) {
      // Smoothly blend the new heading using a low-pass filter (heavy blending at standstill)
      const alpha = isStopped ? 0.08 : 0.35;
      this.currentState.heading = (this.currentState.heading + diff * alpha + 360) % 360;
      this.currentState.compassDirection = this.calculateCompassDirection(this.currentState.heading);
      if (this.onUpdate) this.onUpdate(this.currentState);
    }
  }

  public stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.route = null;
  }

  private speedRollingAverage: number[] = [];
  private readonly MAX_SPEED_SAMPLES = 5;

  private handlePositionUpdate(pos: GeolocationPosition) {
    const { longitude, latitude, accuracy } = pos.coords;
    
    // Update System Monitor with fresh GPS precision
    systemMonitor.updateGpsAccuracy(Math.round(accuracy));

    if (longitude === 0 && latitude === 0) return; // Ignore placeholder/failed coordinates
    
    const now = performance.now();
    const newPos: [number, number] = [longitude, latitude];

    // 0. GPS Noise Filtering - Ignore poor accuracy samples if we already have a fix
    if (this.lastPosition && accuracy > 200) {
      console.warn('[NavigationSystem] Skipping low accuracy sample:', accuracy);
      return;
    }

    if (!this.lastPosition) {
      this.lastPosition = newPos;
      this.lastTime = now;
      this.currentState.currentPosition = newPos;
      // Force immediate jump to current position on first fix
      if (this.onUpdate) this.onUpdate({ ...this.currentState, isMoving: true });
      return;
    }

    const rawDist = this.calculateDistance(this.lastPosition, newPos);
    const dt = (now - this.lastTime) / 1000; // seconds
    let rawSpeed = dt > 0 ? rawDist / dt : 0;

    // 0.5 GPS Spike Rejection: discard unrealistic jumps (e.g., > 100m in <2s or speed > 50 m/s)
    const maxSpikeSpeed = 50; // m/s (~180 km/h)
    if (rawSpeed > maxSpikeSpeed) {
      // If we haven't detected real vehicle motion yet, this is the transition from fallback/cached coords to true GPS lock.
      // Allow it to snap instantly instead of rejecting it!
      if (!this.hasDetectedMotion) {
        console.log('[NavigationSystem] Snapping from default position to first true GPS lock:', rawDist, 'm');
        this.lastPosition = newPos;
        this.lastTime = now;
        this.currentState.currentPosition = newPos;
        this.speedRollingAverage = [];
        if (this.onUpdate) this.onUpdate(this.currentState);
        return;
      }

      console.warn('[NavigationSystem] Spike detected, ignoring position update:', rawDist, 'm in', dt, 's');
      // Do not update lastPosition/time to avoid contaminating future calculations
      return;
    }

    // 2. Dead-Zone Logic (Stationary Lock / GPS Drift filtering)
    // Exit stationary state if we are currently stationary, but require a stronger confidence threshold to avoid jitter/sliding.
    const isCurrentlyStationary = !this.currentState.isMoving;
    const exitStationaryDistanceThreshold = 5.0; // meters
    const exitStationarySpeedThreshold = 1.2; // m/s (~4.3 km/h)
    
    // Enter stationary state if speed drops below 3 km/h (0.833 m/s) and distance is small (< 2.0m)
    const isEnteringStationary = rawDist < 2.0 && rawSpeed < 0.833;
    
    if (isEnteringStationary || (isCurrentlyStationary && rawDist < exitStationaryDistanceThreshold && rawSpeed < exitStationarySpeedThreshold)) {
      this.currentState.isMoving = false;
      this.currentState.speed = 0;
      this.lastPosition = newPos; // Sync to prevent accumulated drift jumps
      this.lastTime = now;
      if (this.onUpdate) this.onUpdate(this.currentState);
      return;
    }

    // 3. Speed Smoothing (Rolling Average)
    this.speedRollingAverage.push(rawSpeed);
    if (this.speedRollingAverage.length > this.MAX_SPEED_SAMPLES) {
      this.speedRollingAverage.shift();
    }
    const smoothedSpeed = this.speedRollingAverage.reduce((a, b) => a + b, 0) / this.speedRollingAverage.length;

    // 4. Position Smoothing (Linear Interpolation / Low‑pass)
    const smoothedPos: [number, number] = [
      this.currentState.currentPosition[0] + (newPos[0] - this.currentState.currentPosition[0]) * this.smoothingFactor,
      this.currentState.currentPosition[1] + (newPos[1] - this.currentState.currentPosition[1]) * this.smoothingFactor
    ];

    // 5. Heading Calculation with speed-gate
    let clampedHeading = this.currentState.heading;
    // Relaxed threshold: Update heading if moving > 1.0m at > 0.5m/s
    if (rawDist > 1.0 && smoothedSpeed > 0.5) { 
      clampedHeading = (Math.atan2(newPos[0] - this.lastPosition[0], newPos[1] - this.lastPosition[1]) * 180) / Math.PI;
    }

    const isMoving = smoothedSpeed > this.speedThreshold;

    // 6. Motion Gate: Stay at start line until real movement is detected
    if (!this.hasDetectedMotion) {
      const distFromStart = this.calculateDistance(this.currentState.currentPosition, smoothedPos);
      // Require either very slight speed or small distance to "unlock" the vehicle
      // Relaxed to 0.2m to ensure immediate response on most devices
      if (smoothedSpeed > 0.1 || distFromStart > 0.2) {
        this.hasDetectedMotion = true;
        console.log('[NavigationSystem] Motion detected - Unlocking vehicle icon.');
      } else {
        // Keep it locked to the previous stable position
        return;
      }
    }

    const compass = this.calculateCompassDirection(clampedHeading);
    
    // PROACTIVE SCAN: Check for hazards 300m ahead
    this.scanForProactiveHazards(smoothedPos);

    this.currentState = {
      currentPosition: smoothedPos,
      heading: clampedHeading,
      compassDirection: compass,
      speed: smoothedSpeed,
      isMoving: isMoving,
      distanceToNext: this.route ? this.calculateDistanceToNextStep(smoothedPos) : 0,
      totalDistanceRemaining: this.route ? this.calculateTotalDistanceRemaining(smoothedPos) : 0
    };

    // 7. Snap-to-Road Logic
    // If we have a route, snap the currentPosition to the nearest point on the route
    if (this.route && this.route.coordinates.length >= 2) {
      const snapped = this.snapToRoute(smoothedPos);
      this.currentState.currentPosition = snapped.point;
      // 7. Snap heading to road direction if available (higher priority than raw GPS heading)
      if (snapped) {
        if (snapped.heading !== null && smoothedSpeed > 0.05) {
          clampedHeading = snapped.heading;
        }
      }

      this.currentState.heading = clampedHeading;
      this.currentState.compassDirection = this.calculateCompassDirection(clampedHeading);
    }

    // MAP MATCHING API INTEGRATION (Step 3)
    // Keep the last 25 GPS coordinates to send a solid trace for Map-Matching
    this.gpsTraceBuffer.push(smoothedPos);
    if (this.gpsTraceBuffer.length > 25) {
      this.gpsTraceBuffer.shift();
    }

    // Call Map Matching API every 5 seconds if we have at least 3 points
    if (now - this.lastMapMatchTime > 5000 && this.gpsTraceBuffer.length >= 3) {
      this.lastMapMatchTime = now;
      this.fetchMapMatching();
    }

    // 8. Maneuver & Step Tracking
    if (this.route) this.trackManeuvers(smoothedPos);

    // 8. Off-Route Detection
    if (this.route) this.checkOffRoute(smoothedPos);

    this.lastPosition = newPos;
    this.lastTime = now;

    // 8. Proactive Proximity Intelligence
    if (this.route) this.checkProximityHazards(smoothedPos);

    if (this.onUpdate) {
      this.onUpdate(this.currentState);
    }
  }

  private configureProfile(profile: string) {
    switch (profile) {
      case 'walking':
        this.speedThreshold = 0.5;
        this.smoothingFactor = 0.3;
        this.minZoom = 18;
        this.maxZoom = 20;
        break;
      case 'cycling':
        this.speedThreshold = 1.0;
        this.smoothingFactor = 0.25;
        this.minZoom = 17;
        this.maxZoom = 19;
        break;
      default: // driving
        this.speedThreshold = 1.5;
        this.smoothingFactor = 0.2;
        this.minZoom = 15.5;
        this.maxZoom = 18.5;
        break;
    }
  }

  public getZoomRange() {
    return { min: this.minZoom, max: this.maxZoom };
  }


  public getCurrentPosition(): [number, number] | null {
    return this.currentState.currentPosition;
  }

  private calculateDistance(p1: [number, number], p2: [number, number]): number {
    const R = 6371e3; // meters
    const φ1 = p1[1] * Math.PI / 180;
    const φ2 = p2[1] * Math.PI / 180;
    const Δφ = (p2[1] - p1[1]) * Math.PI / 180;
    const Δλ = (p2[0] - p1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateDistanceToNextStep(pos: [number, number]): number {
    if (!this.route || !this.route.steps.length) return 0;
    const nextStep = this.route.steps[this.currentStepIndex];
    if (!nextStep) return 0;
    const stepCoords = nextStep.maneuver.location as [number, number];
    return this.calculateDistance(pos, stepCoords);
  }

  private calculateTotalDistanceRemaining(pos: [number, number]): number {
    if (!this.route || !this.route.coordinates.length) return 0;
    
    // 1. Find the nearest point on the route to the current position
    let minIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < this.route.coordinates.length; i++) {
      const d = this.calculateDistance(pos, this.route.coordinates[i]);
      if (d < minDistance) {
        minDistance = d;
        minIndex = i;
      }
    }

    // 2. Sum up distances from current position to nearest point, then along the route to the end
    let total = minDistance;
    for (let i = minIndex; i < this.route.coordinates.length - 1; i++) {
      total += this.calculateDistance(this.route.coordinates[i], this.route.coordinates[i+1]);
    }

    return total;
  }

  private trackManeuvers(pos: [number, number]) {
    if (!this.route || this.currentStepIndex >= this.route.steps.length) return;

    const distanceToNext = this.calculateDistanceToNextStep(pos);
    const nextStep = this.route.steps[this.currentStepIndex];

    // Professional maneuver timing sequence
    if (distanceToNext < 2000 && !nextStep.announced2km) {
      nextStep.announced2km = true;
      if (distanceToNext > 1500) {
        this.speak(`In ${Math.round(distanceToNext/1000)} kilometers, ${nextStep.maneuver.instruction}`);
      }
    }
    if (distanceToNext < 500 && !nextStep.announced500m) {
      nextStep.announced500m = true;
      if (distanceToNext > 150) {
        this.speak(`In ${Math.round(distanceToNext/10)*10} meters, ${nextStep.maneuver.instruction}`);
      }
    }
    if (distanceToNext < 60 && !nextStep.announced50m) {
      nextStep.announced50m = true;
      this.speak(`${nextStep.maneuver.instruction}`);
    }

    // Step completion detection
    if (distanceToNext < 20) {
      this.currentStepIndex++;
      if (this.onStepChange) this.onStepChange(this.route.steps[this.currentStepIndex]);
    }
  }

  private offRouteCount: number = 0;
  private readonly OFF_ROUTE_SAMPLES_REQUIRED = 3;

  private checkOffRoute(pos: [number, number]) {
    if (!this.route) return;
    
    const nearest = this.findNearestPointOnRoute(pos);
    const minDistance = this.calculateDistance(pos, nearest.point);

    if (minDistance > this.offRouteThreshold) {
      this.offRouteCount++;
      if (this.offRouteCount >= this.OFF_ROUTE_SAMPLES_REQUIRED) {
        console.warn(`[NavigationSystem] Mission deviation detected: ${minDistance.toFixed(1)}m. Initializing reroute...`);
        if (this.onOffRoute) this.onOffRoute();
        this.offRouteCount = 0; // Reset after trigger
      }
    } else {
      this.offRouteCount = 0;
    }
  }

  private snapToRoute(pos: [number, number]): { point: [number, number], heading: number | null } {
    if (!this.route) return { point: pos, heading: null };

    let minDistance = Infinity;
    let snappedPoint = pos;
    let snappedHeading: number | null = null;

    for (let i = 0; i < this.route.coordinates.length - 1; i++) {
      const p1 = this.route.coordinates[i];
      const p2 = this.route.coordinates[i + 1];
      const projected = this.projectPointOnSegment(pos, p1, p2);
      const dist = this.calculateDistance(pos, projected);

      if (dist < minDistance) {
        minDistance = dist;
        snappedPoint = projected;
        snappedHeading = (Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI;
      }
    }

    // Only snap if we are reasonably close to the road (e.g., < 40m)
    // If further away, let the off-route logic handle recalculation
    return minDistance < 40 ? { point: snappedPoint, heading: snappedHeading } : { point: pos, heading: null };
  }

  private scanForProactiveHazards(_currentPos: [number, number]) {
    // Proximity scanning logic goes here
  }

  private projectPointOnSegment(p: [number, number], a: [number, number], b: [number, number]): [number, number] {
    const atob = [b[0] - a[0], b[1] - a[1]];
    const atop = [p[0] - a[0], p[1] - a[1]];
    const len = atob[0] * atob[0] + atob[1] * atob[1];
    let dot = atop[0] * atob[0] + atop[1] * atob[1];
    const t = Math.min(1, Math.max(0, dot / len));
    return [a[0] + atob[0] * t, a[1] + atob[1] * t];
  }

  private findNearestPointOnRoute(pos: [number, number]): { point: [number, number], index: number } {
    let minDistance = Infinity;
    let nearestPoint = pos;
    let nearestIndex = 0;

    if (!this.route) return { point: pos, index: 0 };

    for (let i = 0; i < this.route.coordinates.length; i++) {
      const p = this.route.coordinates[i];
      const d = this.calculateDistance(pos, p);
      if (d < minDistance) {
        minDistance = d;
        nearestPoint = p;
        nearestIndex = i;
      }
    }
    return { point: nearestPoint, index: nearestIndex };
  }

  private checkProximityHazards(pos: [number, number]) {
    const hazards = this.route?.hazardsSummary?.details;
    if (!hazards || !hazards.length) return;

    for (const hazard of hazards) {
      if (this.announcedHazards.has(hazard.id)) continue;

      const dist = this.calculateDistance(pos, hazard.location);
      if (dist < 300) { // 300 meters proximity
        const type = hazard.type.replace('_', ' ');
        const severity = hazard.severity === 'critical' ? 'CRITICAL ' : '';
        this.speak(`${severity}Hazard alert: ${type} detected ${Math.round(dist)} meters ahead.`);
        this.announcedHazards.add(hazard.id);
      }
    }
  }

  private speak(text: string) {
    this.voiceQueue.push(text);
    this.processVoiceQueue();
  }

  private processVoiceQueue() {
    if (this.isSpeaking || this.voiceQueue.length === 0) return;
    
    this.isSpeaking = true;
    const text = this.voiceQueue.shift()!;
    const url = `https://api.mapbox.com/voice/v1/speaker?text=${encodeURIComponent(text)}&instructionFormat=text&language=en-US&access_token=${this.MAPBOX_TOKEN}`;
    
    const audio = new Audio(url);
    
    audio.onended = () => {
      this.isSpeaking = false;
      this.processVoiceQueue();
    };
    
    audio.onerror = () => {
      console.warn('[NavigationSystem] Mapbox Voice API failed, falling back to browser TTS');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        this.isSpeaking = false;
        this.processVoiceQueue();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.processVoiceQueue();
      };
      window.speechSynthesis.speak(utterance);
    };

    audio.play().catch((e) => {
      // Handle auto-play restrictions
      audio.onerror(e as any);
    });
  }

  private calculateCompassDirection(bearing: number): string {
    const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
    const index = Math.round(((bearing %= 360) < 0 ? bearing + 360 : bearing) / 45) % 8;
    return directions[index];
  }

  private async fetchMapMatching() {
    try {
      const coords = this.gpsTraceBuffer.map(c => `${c[0]},${c[1]}`).join(';');
      // Using radiuses=25 to allow some GPS jitter tolerance
      const radiuses = this.gpsTraceBuffer.map(() => 25).join(';');
      const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?geometries=geojson&radiuses=${radiuses}&access_token=${this.MAPBOX_TOKEN}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
        const match = data.matchings[0];
        // The last coordinate of the matched geometry is our perfectly snapped current position
        const snappedCoords = match.geometry.coordinates[match.geometry.coordinates.length - 1];
        
        // Update current position strictly to the road network
        this.currentState.currentPosition = snappedCoords as [number, number];
        
        // Also update heading based on the exact road segment
        if (match.geometry.coordinates.length >= 2) {
            const p1 = match.geometry.coordinates[match.geometry.coordinates.length - 2];
            const p2 = snappedCoords;
            const roadHeading = (Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI;
            this.currentState.heading = roadHeading;
            this.currentState.compassDirection = this.calculateCompassDirection(roadHeading);
        }

        if (this.onUpdate) this.onUpdate(this.currentState);
      }
    } catch (e) {
      console.error('[MapMatching] Failed to perfectly snap to road:', e);
    }
  }
}
