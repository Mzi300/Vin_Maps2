import type { OptimizedRoute } from './routeOptimizer';

export interface NavState {
  currentPosition: [number, number];
  heading: number;
  speed: number;
  nextStep?: any;
  distanceToNext: number;
  totalDistanceRemaining: number;
  isMoving: boolean;
}

export class NavigationSystem {
  private route: OptimizedRoute | null = null;
  private watchId: number | null = null;
  private lastPosition: [number, number] | null = null;
  private lastTime: number = 0;
  
  // Dynamic parameters based on profile
  private speedThreshold: number = 3.0; // meters per second (higher to avoid jitter)
  private smoothingFactor: number = 0.2;
  private minZoom: number = 15.5;
  private maxZoom: number = 18.5;
  
  public currentStepIndex: number = 0;
  private voiceQueue: string[] = [];
  private isSpeaking: boolean = false;
  private offRouteThreshold: number = 100; // meters (more generous to allow for GPS jitter)
  
  private currentState: NavState = {
    currentPosition: [0, 0],
    heading: 0,
    speed: 0,
    distanceToNext: 0,
    totalDistanceRemaining: 0,
    isMoving: false
  };

  private hasDetectedMotion: boolean = false;

  public onUpdate?: (state: NavState) => void;
  public onStepChange?: (step: any) => void;
  public onOffRoute?: () => void;

  public snapToPosition(pos: [number, number], heading: number) {
    this.hasDetectedMotion = false; // Reset gate
    this.currentState = {
      currentPosition: pos,
      heading: heading,
      speed: 0,
      distanceToNext: 0,
      totalDistanceRemaining: 0,
      isMoving: false
    };
    this.lastPosition = pos;
    this.lastTime = Date.now();
  }
  public start(route: OptimizedRoute, profile: string = 'driving') {
    this.hasDetectedMotion = false; // Reset gate
    this.route = route;
    this.currentStepIndex = 0;
    this.configureProfile(profile);
    this.startTracking();
  }

  public startTracking() {
    if (this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => console.error('[NavigationSystem] GPS Error:', err),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
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
    if (longitude === 0 && latitude === 0) return; // Ignore placeholder/failed coordinates
    
    const now = performance.now();
    const newPos: [number, number] = [longitude, latitude];

    // 0. GPS Noise Filtering - Ignore poor accuracy samples if we already have a fix
    if (this.lastPosition && accuracy > 50) {
      console.warn('[NavigationSystem] Skipping low accuracy sample:', accuracy);
      return;
    }

    if (!this.lastPosition) {
      this.lastPosition = newPos;
      this.lastTime = now;
      this.currentState.currentPosition = newPos;
      return;
    }

    const rawDist = this.calculateDistance(this.lastPosition, newPos);
    const dt = (now - this.lastTime) / 1000; // seconds
    let rawSpeed = dt > 0 ? rawDist / dt : 0;

    // 0.5 GPS Spike Rejection: discard unrealistic jumps (e.g., > 100m in <2s or speed > 50 m/s)
    const maxSpikeSpeed = 50; // m/s (~180 km/h)
    if (rawSpeed > maxSpikeSpeed) {
      console.warn('[NavigationSystem] Spike detected, ignoring position update:', rawDist, 'm in', dt, 's');
      // Do not update lastPosition/time to avoid contaminating future calculations
      return;
    }

    // 2. Dead-Zone Logic (Stationary Lock)
    // If movement is negligible and speed is low, assume stationary to avoid jitter
    // We use a strict threshold (5.0m) to keep the icon rock-solid
    if (rawDist < 5.0 && rawSpeed < this.speedThreshold) {
      this.currentState.isMoving = false;
      this.currentState.speed = 0;
      this.lastPosition = newPos; // Sync to stop future jumps
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
    let heading = this.currentState.heading;
    // Only update heading if we are moving at a decent speed (> 2m/s) to avoid "spinning" at stops
    if (rawDist > 2.5 && smoothedSpeed > 2.0) { 
      heading = (Math.atan2(newPos[0] - this.lastPosition[0], newPos[1] - this.lastPosition[1]) * 180) / Math.PI;
    }

    const isMoving = smoothedSpeed > this.speedThreshold;

    // 6. Motion Gate: Stay at start line until real movement is detected
    if (!this.hasDetectedMotion) {
      const distFromStart = this.calculateDistance(this.currentState.currentPosition, smoothedPos);
      // Require either decent speed or significant distance to "unlock" the vehicle
      if (smoothedSpeed > 2.0 || distFromStart > 10.0) {
        this.hasDetectedMotion = true;
        console.log('[NavigationSystem] Motion detected - Unlocking vehicle icon.');
      } else {
        // Keep it locked to the previous stable position
        return;
      }
    }

    this.currentState = {
      currentPosition: smoothedPos,
      heading: heading,
      speed: smoothedSpeed,
      isMoving: isMoving,
      distanceToNext: this.route ? this.calculateDistanceToNextStep(smoothedPos) : 0,
      totalDistanceRemaining: this.route ? this.calculateTotalDistanceRemaining(smoothedPos) : 0
    };

    // 7. Maneuver & Step Tracking
    if (this.route) this.trackManeuvers(smoothedPos);

    // 8. Off-Route Detection
    if (this.route) this.checkOffRoute(smoothedPos);

    this.lastPosition = newPos;
    this.lastTime = now;

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

    // Trigger instruction if approaching (e.g., 200m before turn)
    if (distanceToNext < 200 && !nextStep.announced) {
      this.speak(`In ${Math.round(distanceToNext)} meters, ${nextStep.maneuver.instruction}`);
      nextStep.announced = true;
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
    
    let minDistance = Infinity;
    for (let i = 0; i < this.route.coordinates.length; i++) {
      const d = this.calculateDistance(pos, this.route.coordinates[i]);
      if (d < minDistance) minDistance = d;
    }

    if (minDistance > this.offRouteThreshold) {
      this.offRouteCount++;
      if (this.offRouteCount >= this.OFF_ROUTE_SAMPLES_REQUIRED) {
        if (this.onOffRoute) this.onOffRoute();
        this.offRouteCount = 0; // Reset after trigger
      }
    } else {
      this.offRouteCount = 0;
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
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.processVoiceQueue();
    };

    window.speechSynthesis.speak(utterance);
  }
}
