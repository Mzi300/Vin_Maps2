export const CameraMode = {
  DRIVING: 'DRIVING',
  OVERVIEW: 'OVERVIEW',
  RECENTER: 'RECENTER',
  FREE_EXPLORE: 'FREE_EXPLORE'
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

  // Configurable presets
  private presets: Record<CameraMode, any> = {
    [CameraMode.DRIVING]: {
      pitch: 72, // Aggressive windshield perspective
      zoom: 20.2, // Extreme street-level zoom
      minPitch: 55,
      maxPitch: 85,
      minZoom: 19.0, // Force it to stay close
      maxZoom: 22.0,
      padding: { bottom: 280 }, // Lower car for better building view
      lerpPos: 0.1,
      lerpBearing: 0.08,
      lerpPitch: 0.05,
      lerpZoom: 0.05,
      rollIntensity: 0.2,
      lookAhead: 2.5
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
      // Logic handled by Mapbox interactions
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

  public update(coords: [number, number], heading: number, speed: number) {
    if (this.mode === CameraMode.FREE_EXPLORE) return;

    const now = Date.now();
    this.lastUpdateTime = now;
    this.extrapolationTime = 0;

    // Handle stationary/low-speed jitter
    const minHeadingSpeed = 1.0; // m/s
    if (speed < minHeadingSpeed) {
      heading = this.target.bearing; // Keep last known bearing
    }

    this.target.center = coords;
    this.target.bearing = heading;
    this.lastSpeed = speed;

    // Dynamic Zoom/Pitch based on speed
    if (this.mode === CameraMode.DRIVING) {
      const p = this.presets[CameraMode.DRIVING];
      this.target.zoom = Math.max(p.minZoom, p.maxZoom - speed * 0.15);
      this.target.pitch = Math.max(p.minPitch, p.maxPitch - speed * 0.5);
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

    // 2. Bearing Interpolation (Shortest path)
    let diff = this.target.bearing - this.current.bearing;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    
    // Add cinematic roll based on turn rate
    const turnIntensity = diff * (this.lastSpeed / 10) * preset.rollIntensity;
    const currentRoll = Math.max(-10, Math.min(10, turnIntensity));
    
    this.current.bearing += diff * getLerp(preset.lerpBearing);

    // 3. Zoom & Pitch Interpolation
    this.current.zoom += (this.target.zoom - this.current.zoom) * getLerp(preset.lerpZoom);
    this.current.pitch += (this.target.pitch - this.current.pitch) * getLerp(preset.lerpPitch);

    // 4. Apply to map
    this.map.jumpTo({
      center: [this.current.center[0], this.current.center[1]],
      bearing: this.current.bearing + currentRoll,
      zoom: this.current.zoom,
      pitch: this.current.pitch
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
