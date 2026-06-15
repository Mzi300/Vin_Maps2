export const CameraMode = {
  THIRD_PERSON: 'THIRD_PERSON',
  CINEMATIC: 'CINEMATIC',
  NAVIGATION: 'NAVIGATION',
  HOOD: 'HOOD',
  TOWNSHIP: 'TOWNSHIP',
  OVERVIEW: 'OVERVIEW',
  RECENTER: 'RECENTER',
  FREE_EXPLORE: 'FREE_EXPLORE',
  STANDSTILL: 'STANDSTILL'
} as const;

export type CameraMode = typeof CameraMode[keyof typeof CameraMode];

interface CameraState {
  center: [number, number];
  bearing: number;
  pitch: number;
  zoom: number;
}

export class NavigationCameraController {
  private map: mapboxgl.Map;
  private mode: CameraMode = CameraMode.CINEMATIC;
  private isUserInteracting: boolean = false;
  
  // Current interpolated state
  private current: CameraState = { center: [0, 0], bearing: 0, pitch: 0, zoom: 14 };
  // Target state (from GPS/Nav system)
  private target: CameraState = { center: [0, 0], bearing: 0, pitch: 0, zoom: 14 };

  private lastSpeed: number = 0;
  private lastTimestamp: number = 0;
  private animationId: number | null = null;
  private idleTimer: any = null;
  private readonly AUTO_RECENTER_DELAY = 7000; 
  private currentVehiclePos: [number, number] = [0, 0];
  private currentVehicleBearing: number = 0;

  // Standstill management state
  private isStandstillActive: boolean = false;
  private lastStandstillDetectTime: number = 0;
  private preStandstillMode: CameraMode | null = null;

  // Cinematic State
  private cinematicTimer: number = 0;
  private cinematicAngleOffset: number = 45;
  private cinematicPitchTarget: number = 60;
  private cinematicZoomTarget: number = 18.5;
  
  // Hood Camera State
  private vibrationOffset: number = 0;

  // Configurable presets
  private presets: Record<CameraMode, any> = {
    [CameraMode.THIRD_PERSON]: {
      basePitch: 50, minPitch: 40, maxPitch: 65,
      baseZoom: 18.5, minZoom: 15.0, maxZoom: 19.5,
      padding: { bottom: 150 }, 
      lerpPos: 0.15, lerpBearing: 0.15, lerpPitch: 0.08, lerpZoom: 0.05,
      rollIntensity: 0.2, lookAhead: 1.5 
    },
    [CameraMode.NAVIGATION]: {
      basePitch: 45, minPitch: 35, maxPitch: 58, 
      baseZoom: 19.0, minZoom: 14.5, maxZoom: 19.5,
      padding: { bottom: 180 }, 
      lerpPos: 0.25, lerpBearing: 0.35, lerpPitch: 0.08, lerpZoom: 0.08,
      rollIntensity: 0.1, lookAhead: 0 
    },
    [CameraMode.CINEMATIC]: {
      basePitch: 60, minPitch: 20, maxPitch: 80,
      baseZoom: 18.5, minZoom: 14.0, maxZoom: 20.0,
      padding: { bottom: 100 },
      lerpPos: 0.03, lerpBearing: 0.02, lerpPitch: 0.01, lerpZoom: 0.01,
      rollIntensity: 0.0, lookAhead: 0
    },
    [CameraMode.HOOD]: {
      basePitch: 82, minPitch: 80, maxPitch: 85,
      baseZoom: 20.5, minZoom: 19.0, maxZoom: 22.0,
      padding: { bottom: 300 }, // Push horizon up
      lerpPos: 0.4, lerpBearing: 0.5, lerpPitch: 0.2, lerpZoom: 0.2,
      rollIntensity: 0.4, lookAhead: 0.5
    },
    [CameraMode.TOWNSHIP]: {
      basePitch: 65, minPitch: 55, maxPitch: 75,
      baseZoom: 19.8, minZoom: 18.5, maxZoom: 21.0,
      padding: { bottom: 120 }, 
      lerpPos: 0.1, lerpBearing: 0.1, lerpPitch: 0.05, lerpZoom: 0.05,
      rollIntensity: 0.05, lookAhead: 0
    },
    [CameraMode.OVERVIEW]: {
      basePitch: 0, minPitch: 0, maxPitch: 0,
      baseZoom: 14, minZoom: 12, maxZoom: 16,
      padding: { bottom: 0 },
      lerpPos: 0.05, lerpBearing: 0.05, lerpPitch: 0.05, lerpZoom: 0.05,
      rollIntensity: 0, lookAhead: 0
    },
    [CameraMode.RECENTER]: {
      basePitch: 60, minPitch: 60, maxPitch: 60,
      baseZoom: 19, minZoom: 19, maxZoom: 19,
      padding: { bottom: 220 },
      lerpPos: 0.15, lerpBearing: 0.22, lerpPitch: 0.1, lerpZoom: 0.1,
      rollIntensity: 0, lookAhead: 0
    },
    [CameraMode.STANDSTILL]: {
      basePitch: 40, minPitch: 35, maxPitch: 45,
      baseZoom: 17.5, minZoom: 16.5, maxZoom: 18.5,
      padding: { bottom: 80 },
      lerpPos: 0.04, lerpBearing: 0.02, lerpPitch: 0.03, lerpZoom: 0.03,
      rollIntensity: 0.0, lookAhead: 0
    },
    [CameraMode.FREE_EXPLORE]: {}
  };

  constructor(map: mapboxgl.Map) {
    this.map = map;
    this.init();
  }

  private init() {
    this.current = {
      center: [this.map.getCenter().lng, this.map.getCenter().lat],
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      zoom: this.map.getZoom()
    };
    this.target = { ...this.current };
    this.currentVehiclePos = [...this.current.center];
    this.currentVehicleBearing = this.current.bearing;

    this.setupInteractions();
    this.startAnimationLoop();
  }

  private setupInteractions() {
    const unlock = (e?: any) => {
      const isUser = this.isUserInteracting || (e && e.originalEvent) || (e && e.type === 'wheel');
      if (!isUser) return;
      if (this.mode !== CameraMode.FREE_EXPLORE) {
        this.setMode(CameraMode.FREE_EXPLORE);
        window.dispatchEvent(new CustomEvent('nav-camera-unlocked'));
      }
      this.resetIdleTimer();
    };

    this.map.on('dragstart', unlock);
    this.map.on('wheel', unlock);
    this.map.on('rotatestart', unlock);
    this.map.on('pitchstart', unlock);
    this.map.on('zoomstart', unlock);
    
    this.map.on('mousedown', () => { this.isUserInteracting = true; });
    this.map.on('touchstart', () => { this.isUserInteracting = true; });

    window.addEventListener('mouseup', () => { this.isUserInteracting = false; });
    window.addEventListener('touchend', () => { this.isUserInteracting = false; });

    this.map.on('move', () => { this.resetIdleTimer(); });
  }

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.mode === CameraMode.FREE_EXPLORE && this.lastSpeed > 1) {
      this.idleTimer = setTimeout(() => {
        this.recenter();
      }, this.AUTO_RECENTER_DELAY);
    }
  }

  public setMode(mode: CameraMode) {
    if (this.mode === mode) return;
    this.mode = mode;

    if (mode !== CameraMode.FREE_EXPLORE) {
      const preset = this.presets[mode];
      this.map.easeTo({
        padding: preset.padding || { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 1000
      });
    }
  }

  private lastUpdateTime: number = 0;
  private extrapolationTime: number = 0;
  private readonly MAX_EXTRAPOLATION_TIME = 3000; 

  public update(coords: [number, number], heading: number, speed: number, force: boolean = false) {
    const speedKmh = speed * 3.6;
    const isLowSpeed = speedKmh < 3.0; // below 3 km/h
    
    // 1. STANDSTILL DETECTION & AUTOMATED STATE TRANSITIONS
    if (isLowSpeed) {
      if (!this.isStandstillActive) {
        if (this.lastStandstillDetectTime === 0) {
          this.lastStandstillDetectTime = Date.now();
        } else if (Date.now() - this.lastStandstillDetectTime >= 2500) { // 2.5 seconds threshold
          this.isStandstillActive = true;
          this.enterStandstillMode();
        }
      }
    } else {
      this.lastStandstillDetectTime = 0;
      if (this.isStandstillActive) {
        this.isStandstillActive = false;
        this.exitStandstillMode();
      }
    }

    const speedChangedToMoving = speed > 0.55 && this.lastSpeed <= 0.55; // 2 km/h boundary
    this.lastSpeed = speed;

    this.target.center = coords;
    this.target.bearing = heading;

    if (this.mode === CameraMode.FREE_EXPLORE) {
      if (speedChangedToMoving) this.resetIdleTimer();
      return;
    }

    const now = Date.now();
    this.lastUpdateTime = now;
    this.extrapolationTime = 0;

    if (force) {
      this.current.bearing = this.target.bearing;
      this.current.center = [...this.target.center];
      this.currentVehiclePos = [...this.target.center];
      this.currentVehicleBearing = this.target.bearing;
    }

    // Dynamic Smart Camera AI processing based on speed and mode
    if (
      this.mode !== CameraMode.CINEMATIC &&
      this.mode !== CameraMode.OVERVIEW &&
      this.mode !== CameraMode.RECENTER &&
      this.mode !== CameraMode.STANDSTILL
    ) {
      const p = this.presets[this.mode];
      
      // Speed-based dynamic zooming
      this.target.zoom = Math.max(p.minZoom, p.baseZoom - (speed * 0.1)); 
      
      // Dynamic pitch targeting
      this.target.pitch = Math.min(p.maxPitch, p.basePitch + (speed * 0.5));

      if (this.mode === CameraMode.TOWNSHIP) {
        this.target.zoom = Math.max(p.minZoom, p.baseZoom - (speed * 0.15));
        this.target.pitch = Math.min(p.maxPitch, p.basePitch - (speed * 0.2)); 
      }
    } else if (this.mode === CameraMode.STANDSTILL) {
      const p = this.presets[CameraMode.STANDSTILL];
      this.target.zoom = p.baseZoom;
      this.target.pitch = p.basePitch;
    }
  }

  private enterStandstillMode() {
    if (
      this.mode !== CameraMode.FREE_EXPLORE &&
      this.mode !== CameraMode.OVERVIEW &&
      this.mode !== CameraMode.STANDSTILL &&
      this.mode !== CameraMode.RECENTER
    ) {
      this.preStandstillMode = this.mode;
      this.setMode(CameraMode.STANDSTILL);
    }
  }

  private exitStandstillMode() {
    if (this.mode === CameraMode.STANDSTILL) {
      const restoreMode = this.preStandstillMode || CameraMode.NAVIGATION;
      this.setMode(restoreMode);
    }
  }

  public recenter() {
    this.setMode(CameraMode.RECENTER);
    window.dispatchEvent(new CustomEvent('nav-camera-locked'));
    setTimeout(() => {
      if (this.mode === CameraMode.RECENTER) {
        if (this.isStandstillActive) {
          this.setMode(CameraMode.STANDSTILL);
        } else {
          this.setMode(this.preStandstillMode || CameraMode.NAVIGATION);
        }
      }
    }, 2000);
  }

  private startAnimationLoop() {
    const loop = (timestamp: number) => {
      const now = Date.now();
      if (this.lastTimestamp === 0) {
        this.lastTimestamp = timestamp;
        this.lastUpdateTime = now;
      }
      const dt = Math.min(2.0, (timestamp - this.lastTimestamp) / 16.67);
      this.lastTimestamp = timestamp;

      // GPS Signal Loss Handling (Kalman-style Dead Reckoning)
      const timeSinceUpdate = now - this.lastUpdateTime;
      if (timeSinceUpdate > 1000 && timeSinceUpdate < this.MAX_EXTRAPOLATION_TIME && this.lastSpeed > 2) {
        this.extrapolate(dt);
      }

      this.step(dt);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private extrapolate(dt: number) {
    const offsetMeters = this.lastSpeed * (dt * 0.01667);
    const bearingRad = (this.target.bearing * Math.PI) / 180;
    const lat = this.target.center[1];
    const offsetLat = (offsetMeters * Math.cos(bearingRad)) / 110540;
    const offsetLng = (offsetMeters * Math.sin(bearingRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
    
    this.target.center[0] += offsetLng;
    this.target.center[1] += offsetLat;
    this.extrapolationTime += dt * 16.67;
  }

  private step(dt: number) {
    const preset = this.presets[this.mode] || this.presets[CameraMode.NAVIGATION];
    const getLerp = (factor: number) => 1 - Math.pow(1 - factor, dt);

    // 0. Smoothly interpolate the 3D vehicle position/bearing at 60fps
    if (this.currentVehiclePos[0] === 0) {
      this.currentVehiclePos = [...this.target.center];
      this.currentVehicleBearing = this.target.bearing;
    } else {
      let lerpPosFactor = 0.15;
      let lerpBearingFactor = 0.2;
      
      if (this.mode === CameraMode.STANDSTILL) {
        lerpPosFactor = 0.05; // Lock camera position gradually
        lerpBearingFactor = 0.02; // Slower bearing updates
      }

      this.currentVehiclePos[0] += (this.target.center[0] - this.currentVehiclePos[0]) * getLerp(lerpPosFactor);
      this.currentVehiclePos[1] += (this.target.center[1] - this.currentVehiclePos[1]) * getLerp(lerpPosFactor);

      let vDiff = this.target.bearing - this.currentVehicleBearing;
      while (vDiff < -180) vDiff += 360;
      while (vDiff > 180) vDiff -= 360;

      // Noise gate for vehicle bearing: ignore micro-fluctuations under 5 degrees during standstill
      if (this.mode === CameraMode.STANDSTILL && Math.abs(vDiff) < 5.0) {
        vDiff = 0;
      }
      this.currentVehicleBearing += vDiff * getLerp(lerpBearingFactor);
    }

    if ((this.map as any).visualEffects) {
      (this.map as any).visualEffects.updateUserVehicle(
        [this.currentVehiclePos[0], this.currentVehiclePos[1]],
        this.currentVehicleBearing
      );
    }

    if (this.mode === CameraMode.FREE_EXPLORE || this.isUserInteracting) return;

    let targetCenter = [...this.target.center];
    let targetBearing = this.target.bearing;
    let targetPitch = this.target.pitch;
    let targetZoom = this.target.zoom;
    let currentRoll = 0;

    // --- SMART CAMERA INTELLIGENCE ---
    if (this.mode === CameraMode.CINEMATIC) {
      this.cinematicTimer += dt * 16.67; 
      
      // Cycle camera shot every 5-8 seconds
      if (this.cinematicTimer > 6000 + Math.random() * 3000) {
        this.cinematicTimer = 0;
        const shotType = Math.floor(Math.random() * 5);
        if (shotType === 0) {
          this.cinematicAngleOffset = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40);
          this.cinematicPitchTarget = 75; 
          this.cinematicZoomTarget = 19.5; 
        } else if (shotType === 1) {
          this.cinematicAngleOffset = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 120);
          this.cinematicPitchTarget = 30; 
          this.cinematicZoomTarget = 16.5; 
        } else if (shotType === 2) {
          this.cinematicAngleOffset = 180 + (Math.random() > 0.5 ? 20 : -20);
          this.cinematicPitchTarget = 65; 
          this.cinematicZoomTarget = 18.5; 
        } else if (shotType === 3) { // Dynamic Highway Camera
          this.cinematicAngleOffset = 0;
          this.cinematicPitchTarget = 40;
          this.cinematicZoomTarget = 17.5;
        } else {
          this.cinematicAngleOffset = (Math.random() * 90) - 45;
          this.cinematicPitchTarget = 55;
          this.cinematicZoomTarget = 18.0;
        }

        // GTA 5 Hard-Cut Effect: Instantaneously snap the camera to the new angle
        this.current.bearing = this.currentVehicleBearing + this.cinematicAngleOffset;
        this.current.pitch = this.cinematicPitchTarget;
        this.current.zoom = this.cinematicZoomTarget;
      }

      // Very slow cinematic drift while holding the shot
      this.cinematicAngleOffset += (Math.random() > 0.5 ? 0.02 : -0.02) * dt;

      targetBearing = this.currentVehicleBearing + this.cinematicAngleOffset;
      targetPitch = this.cinematicPitchTarget;
      targetZoom = this.cinematicZoomTarget;
      
      const offsetMeters = 20;
      const camBearingRad = (targetBearing * Math.PI) / 180;
      const lat = targetCenter[1];
      targetCenter[0] += (offsetMeters * Math.sin(camBearingRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
      targetCenter[1] += (offsetMeters * Math.cos(camBearingRad)) / 110540;

    } else {
      // --- ALL OTHER MODES ---
      if (preset.lookAhead > 0 && this.lastSpeed > 2) {
        const offsetMeters = this.lastSpeed * preset.lookAhead;
        const bearingRad = (this.target.bearing * Math.PI) / 180;
        const lat = targetCenter[1];
        const offsetLat = (offsetMeters * Math.cos(bearingRad)) / 110540;
        const offsetLng = (offsetMeters * Math.sin(bearingRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
        targetCenter[0] += offsetLng;
        targetCenter[1] += offsetLat;
      }
      
      let diff = targetBearing - this.current.bearing;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      // Standstill map rotation noise gate: ignore camera rotation changes under 5 degrees when stopped
      if (this.mode === CameraMode.STANDSTILL) {
        if (Math.abs(diff) < 5.0) {
          targetBearing = this.current.bearing;
        }
      }

      const turnIntensity = diff * (this.lastSpeed / 10) * preset.rollIntensity;
      currentRoll = Math.max(-10, Math.min(10, turnIntensity));

      // Simulate vibrations in HOOD mode
      if (this.mode === CameraMode.HOOD && this.lastSpeed > 5) {
        this.vibrationOffset = (Math.random() - 0.5) * 0.2;
        targetPitch += this.vibrationOffset;
      }
    }

    // 1. Position Interpolation
    this.current.center[0] += (targetCenter[0] - this.current.center[0]) * getLerp(preset.lerpPos);
    this.current.center[1] += (targetCenter[1] - this.current.center[1]) * getLerp(preset.lerpPos);

    // 2. Bearing Interpolation (Shortest path)
    let diff = targetBearing - this.current.bearing;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    this.current.bearing += diff * getLerp(preset.lerpBearing);

    // 3. Zoom & Pitch Interpolation
    this.current.zoom += (targetZoom - this.current.zoom) * getLerp(preset.lerpZoom);
    this.current.pitch += (targetPitch - this.current.pitch) * getLerp(preset.lerpPitch);

    // 4. Apply to map
    this.map.jumpTo({
      center: [this.current.center[0], this.current.center[1]],
      bearing: this.current.bearing + currentRoll,
      zoom: this.current.zoom,
      pitch: this.current.pitch,
      padding: preset.padding || { top: 0, bottom: 0, left: 0, right: 0 }
    }, { cameraController: true });
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
