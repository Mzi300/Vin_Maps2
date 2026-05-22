export const CameraMode = {
  DRIVING: 'DRIVING',
  OVERVIEW: 'OVERVIEW',
  RECENTER: 'RECENTER',
  FREE_EXPLORE: 'FREE_EXPLORE',
  NORTH_UP: 'NORTH_UP',
  HEADING_UP: 'HEADING_UP',
  AUTO: 'AUTO',
  CINEMATIC: 'CINEMATIC'
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
  private mode: CameraMode = CameraMode.FREE_EXPLORE;
  
  // Current interpolated state
  private current: CameraState = {
    center: [0, 0],
    bearing: 0,
    pitch: 0,
    zoom: 14
  };

  // Target state (from GPS/Nav system)
  private target: CameraState = {
    center: [0, 0],
    bearing: 0,
    pitch: 0,
    zoom: 14
  };

  private lastSpeed: number = 0;
  private lastTimestamp: number = 0;
  private animationId: number | null = null;
  private isDevelopment: boolean = import.meta.env.MODE === 'development';
  private readonly JITTER_ANGLE_THRESHOLD: number = 2; // degrees tolerance to ignore compass jitter
  // Speed below which the vehicle is considered stationary (km/h)
  private readonly MIN_STATIONARY_SPEED: number = 2;

  // Route / cinematic state
  private routeGenerated: boolean = false;
  private routeCoordinates: [number, number][] = [];
  private currentSegmentIdx: number = 0;
  private routeLocked: boolean = false; // true once initial bearing is locked

  // Configurable presets
  private presets: Record<CameraMode, any> = {
    [CameraMode.DRIVING]: {
      pitch: 68, // Grounded tactical perspective
      zoom: 16.2,
      minPitch: 60,
      maxPitch: 78,
      minZoom: 15.0,
      maxZoom: 18.5,
      padding: { bottom: 180 },
      lerpPos: 0.15,
      lerpBearing: 0.12,
      lerpPitch: 0.06,
      lerpZoom: 0.06,
      rollIntensity: 0.4,
      lookAhead: 3.5,
      // low‑speed bearing lerp factor (used when speed < 5 km/h)
      lowSpeedLerpBearing: 0.04
    },
    [CameraMode.OVERVIEW]: {
      pitch: 0,
      zoom: 14,
      padding: { bottom: 0 },
      lerpPos: 0.05,
      lerpBearing: 0.05,
      lerpPitch: 0.05,
      lerpZoom: 0.05,
      rollIntensity: 0,
      lookAhead: 0
    },
    [CameraMode.RECENTER]: {
      pitch: 65,
      zoom: 18,
      padding: { bottom: 200 },
      lerpPos: 0.15,
      lerpBearing: 0.15,
      lerpPitch: 0.1,
      lerpZoom: 0.1,
      rollIntensity: 0,
      lookAhead: 0
    },
    [CameraMode.FREE_EXPLORE]: {
      // Logic handled by manual Mapbox interactions
    },
    // New modes
    [CameraMode.NORTH_UP]: {
      // Keep bearing fixed to true north (0°), pitch and zoom same as DRIVING baseline
      bearing: 0,
      pitch: 0,
      zoom: 16,
      padding: { bottom: 160 },
      lerpPos: 0.12,
      lerpBearing: 0.0, // no bearing interpolation
      lerpPitch: 0.06,
      lerpZoom: 0.06,
      rollIntensity: 0,
      lookAhead: 0
    },
    [CameraMode.HEADING_UP]: {
      // Bearing follows vehicle heading but with same smoothing as DRIVING
      pitch: 68,
      zoom: 16.2,
      padding: { bottom: 180 },
      lerpPos: 0.15,
      lerpBearing: 0.12,
      lerpPitch: 0.06,
      lerpZoom: 0.06,
      rollIntensity: 0.4,
      lookAhead: 3.5,
      lowSpeedLerpBearing: 0.04
    },
    [CameraMode.AUTO]: {
      // Mirrors DRIVING behaviour, but will automatically switch to NORTH_UP when speed == 0
      pitch: 68,
      zoom: 16.2,
      padding: { bottom: 180 },
      lerpPos: 0.15,
      lerpBearing: 0.12,
      lerpPitch: 0.06,
      lerpZoom: 0.06,
      rollIntensity: 0.4,
      lookAhead: 3.5,
      lowSpeedLerpBearing: 0.04
    }
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

    this.setupInteractions();
    this.startAnimationLoop();
  }

  private setupInteractions() {
    const unlock = () => {
      if (this.mode !== CameraMode.FREE_EXPLORE) {
        this.setMode(CameraMode.FREE_EXPLORE);
        window.dispatchEvent(new CustomEvent('nav-camera-unlocked'));
        this.log('Camera unlocked - Manual control detected');
      }
    };

    // Use only events that are guaranteed to be user-initiated
    this.map.on('dragstart', unlock);
    this.map.on('wheel', unlock);
    this.map.on('touchstart', unlock);
    
    // mousedown is also a good indicator of manual interaction
    this.map.on('mousedown', () => {
      // We don't unlock immediately on mousedown to allow clicking POIs,
      // but we can use it to track potential intent.
    });
  }

  public setMode(mode: CameraMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.log(`Camera mode changed to: ${mode}`);

    if (mode === CameraMode.DRIVING || mode === CameraMode.RECENTER) {
      const preset = this.presets[mode];
      this.map.easeTo({
        padding: preset.padding,
        duration: 1000
      });
    } else if (mode === CameraMode.FREE_EXPLORE || mode === CameraMode.OVERVIEW) {
      this.map.easeTo({
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 1000
      });
    }
  }

  private lastUpdateTime: number = 0;
  private extrapolationTime: number = 0;
  private readonly MAX_EXTRAPOLATION_TIME = 3000; // 3 seconds

  public update(coords: [number, number], heading: number, speed: number, force: boolean = false) {
    if (this.mode === CameraMode.FREE_EXPLORE) return;

    const now = Date.now();
    this.lastUpdateTime = now;
    this.extrapolationTime = 0;

    // ---------- CINEMATIC LOCKED BEHAVIOR ----------
    if (this.mode === CameraMode.CINEMATIC) {
      // If we have a route, lock the initial bearing once
      if (this.routeGenerated && !this.routeLocked && this.routeCoordinates.length >= 2) {
        const initBearing = this.computeBearing(this.routeCoordinates[0], this.routeCoordinates[1]);
        this.target.bearing = initBearing;
        this.current.bearing = initBearing;
        this.routeLocked = true;
      }

      // When moving, use movement vector or route segment bearing
      if (speed > 0) {
        // Determine bearing from route segment if available
        let segmentBearing = this.target.bearing;
        if (this.routeGenerated && this.currentSegmentIdx < this.routeCoordinates.length - 1) {
          const a = this.routeCoordinates[this.currentSegmentIdx];
          const b = this.routeCoordinates[this.currentSegmentIdx + 1];
          segmentBearing = this.computeBearing(a, b);
        }
        // Apply heading only if we have a reliable movement bearing
        this.target.bearing = segmentBearing;

        // Advance segment index when we are close to next point
        if (this.routeGenerated && this.currentSegmentIdx < this.routeCoordinates.length - 1) {
          const nextPt = this.routeCoordinates[this.currentSegmentIdx + 1];
          const distToNext = this.calculateDistance(coords, nextPt);
          if (distToNext < 15) { // meters threshold
            this.currentSegmentIdx++;
          }
        }
      }
      return;
    }

    // Existing bearing logic for other modes (unchanged below)

    // Handle stationary/low‑speed jitter and mode‑specific bearing logic
    const minHeadingSpeed = 0.5; // speed (km/h) above which we consider heading reliable
    const lowSpeedThreshold = 5; // km/h
    // Minimal bearing change to apply (degrees) – avoids jitter from GPS/compass noise

    // Determine which bearing should be used based on mode and speed
    let effectiveBearing = this.target.bearing; // default fallback

    // If vehicle is considered stationary, keep current bearing locked
    if (speed < this.MIN_STATIONARY_SPEED) {
      // keep effectiveBearing as existing target bearing (no change)
    } else if (speed >= minHeadingSpeed) {
      // Use heading when speed is sufficient
      effectiveBearing = heading;
    } else {
      // Apply jitter threshold to avoid small compass fluctuations when moving slowly
      if (Math.abs(heading - this.target.bearing) < this.JITTER_ANGLE_THRESHOLD) {
        effectiveBearing = this.target.bearing;
      }
    }

    // Mode‑specific overrides
    if (this.mode === CameraMode.NORTH_UP) {
      effectiveBearing = 0; // lock to true north
    } else if (this.mode === CameraMode.AUTO && speed < this.MIN_STATIONARY_SPEED) {
      effectiveBearing = 0; // AUTO switches to north‑up when stationary
    }
    // Update target bearing only when we have a new value to apply
    if (effectiveBearing !== this.target.bearing) {
      this.target.bearing = effectiveBearing;
    }

    this.target.center = coords;
    this.lastSpeed = speed;

    if (force) {
      this.current.bearing = this.target.bearing;
      this.current.center = [...this.target.center];
    }

    // Dynamic Zoom/Pitch based on speed (only for DRIVING or AUTO mode)
    if (this.mode === CameraMode.DRIVING || this.mode === CameraMode.AUTO) {
      const p = this.presets[CameraMode.DRIVING];
      this.target.zoom = Math.max(p.minZoom, p.maxZoom - (speed * 0.08));
      this.target.pitch = Math.min(p.maxPitch, p.pitch + (speed * 0.15));
    }

  }

  public recenter() {
    this.setMode(CameraMode.RECENTER);
    window.dispatchEvent(new CustomEvent('nav-camera-locked'));
    
    setTimeout(() => {
      if (this.mode === CameraMode.RECENTER) {
        this.setMode(CameraMode.DRIVING);
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

      // GPS Signal Loss Handling (Dead Reckoning)
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
    // Basic dead reckoning: move target center based on speed and bearing
    const offsetMeters = this.lastSpeed * (dt * 0.01667);
    const bearingRad = (this.target.bearing * Math.PI) / 180;
    const lat = this.target.center[1];
    const offsetLat = (offsetMeters * Math.cos(bearingRad)) / 110540;
    const offsetLng = (offsetMeters * Math.sin(bearingRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
    
    this.target.center[0] += offsetLng;
    this.target.center[1] += offsetLat;
    
    if (this.extrapolationTime === 0) {
      this.log('GPS Signal weak - entering dead reckoning mode');
    }
    this.extrapolationTime += dt * 16.67;
  }

  // -------------------------------------------------------------------
  // Helper utilities for cinematic navigation
  // -------------------------------------------------------------------
  private computeBearing(a: [number, number], b: [number, number]): number {
    const dy = b[1] - a[1];
    const dx = b[0] - a[0];
    const rad = Math.atan2(dx, dy);
    return (rad * 180) / Math.PI;
  }

  private calculateDistance(p1: [number, number], p2: [number, number]): number {
    const R = 6371e3;
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

  /**
   * Provide route geometry to the camera controller.
   * The controller will align to the first segment and then follow a cinematic locked view.
   */
  public setRoute(routeCoords: [number, number][]) {
    if (!routeCoords || routeCoords.length < 2) return;
    this.routeCoordinates = routeCoords;
    this.routeGenerated = true;
    this.currentSegmentIdx = 0;
    this.routeLocked = false;
    // Immediately align bearing to first segment direction
    const initBearing = this.computeBearing(routeCoords[0], routeCoords[1]);
    this.target.bearing = initBearing;
    this.current.bearing = initBearing;
    // Switch to cinematic mode automatically
    this.setMode(CameraMode.CINEMATIC);
  }

  /**
   * Start the cinematic navigation after a route has been set.
   * This forces the camera into the locked‑behind behaviour.
   */
  public startCinematicNavigation() {
    if (!this.routeGenerated) return;
    this.setMode(CameraMode.CINEMATIC);
  }

  private step(dt: number) {
    if (this.mode === CameraMode.FREE_EXPLORE) return;

    const preset = this.presets[this.mode] || this.presets[CameraMode.DRIVING];
    
    // Frame-rate independent LERP factor
    const getLerp = (factor: number) => 1 - Math.pow(1 - factor, dt);

    // 1. Position Interpolation with Look-ahead
    let targetCenter = [...this.target.center];
    if (preset.lookAhead > 0 && this.lastSpeed > 2) {
      const offsetMeters = this.lastSpeed * preset.lookAhead;
      const bearingRad = (this.target.bearing * Math.PI) / 180;
      const lat = targetCenter[1];
      const offsetLat = (offsetMeters * Math.cos(bearingRad)) / 110540;
      const offsetLng = (offsetMeters * Math.sin(bearingRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
      targetCenter[0] += offsetLng;
      targetCenter[1] += offsetLat;
    }

    this.current.center[0] += (targetCenter[0] - this.current.center[0]) * getLerp(preset.lerpPos);
    this.current.center[1] += (targetCenter[1] - this.current.center[1]) * getLerp(preset.lerpPos);

    // 2. Bearing Interpolation (Shortest path) with speed‑based smoothing
    let diff = this.target.bearing - this.current.bearing;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    // Choose lerp factor based on speed and mode
    let bearingLerpFactor = preset.lerpBearing;
    if (this.mode === CameraMode.AUTO) {
      // AUTO switches to NORTH_UP when stationary
      if (this.lastSpeed === 0) {
        // No rotation needed – bearing locked at 0
        bearingLerpFactor = 0;
      } else if (this.lastSpeed < 5 && this.lastSpeed > 0) {
        // Apply extra smoothing for low‑speed jitter
        bearingLerpFactor = (preset.lowSpeedLerpBearing ?? preset.lerpBearing) * 0.5;
      }
    } else if (this.lastSpeed === 0) {
      // Stationary in other modes – lock bearing
      bearingLerpFactor = 0;
    } else if (this.lastSpeed < 5 && this.lastSpeed > 0) {
      // General low‑speed smoothing for other modes
      bearingLerpFactor = (preset.lowSpeedLerpBearing ?? preset.lerpBearing) * 0.5;
    }

    const turnIntensity = diff * (this.lastSpeed / 10) * preset.rollIntensity;
    const currentRoll = Math.max(-10, Math.min(10, turnIntensity));

    this.current.bearing += diff * getLerp(bearingLerpFactor);

    // 3. Zoom & Pitch Interpolation
    this.current.zoom += (this.target.zoom - this.current.zoom) * getLerp(preset.lerpZoom);
    this.current.pitch += (this.target.pitch - this.current.pitch) * getLerp(preset.lerpPitch);

    // 4. Apply to map
    this.map.jumpTo({
      center: [this.current.center[0], this.current.center[1]],
      bearing: this.current.bearing + currentRoll,
      zoom: this.current.zoom,
      pitch: this.current.pitch,
      padding: preset.padding || { top: 0, bottom: 0, left: 0, right: 0 }
    });
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private log(message: string) {
    if (this.isDevelopment) {
      console.log(`[NavigationCameraController] ${message}`);
    }
  }
}
