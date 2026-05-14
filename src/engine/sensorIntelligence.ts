import { realtime } from './realtimeService';
import { NavigationSystem } from './navigationSystem';

export class SensorIntelligence {
  private lastZ: number = 0;
  private potholeThreshold: number = 18.0; // m/s^2 (~1.8G deviation)
  private brakingThreshold: number = -5.5; // m/s^2 (Hard braking)
  private isMonitoring: boolean = false;
  private navSystem: NavigationSystem;

  constructor(navSystem: NavigationSystem) {
    this.navSystem = navSystem;
  }

  public start() {
    if (this.isMonitoring) return;
    
    // Request permission for iOS 13+ devices
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            this.initListeners();
          }
        })
        .catch(console.error);
    } else {
      this.initListeners();
    }
  }

  private initListeners() {
    window.addEventListener('devicemotion', (event) => this.handleMotion(event));
    this.isMonitoring = true;
    console.log('[SensorIntelligence] AI Road Monitoring ACTIVE');
  }

  private handleMotion(event: DeviceMotionEvent) {
    const acc = event.acceleration; // Acceleration without gravity
    if (!acc || acc.z === null || acc.y === null) return;

    // 1. Pothole Detection (Vertical Z-axis spike)
    const deltaZ = Math.abs(acc.z - this.lastZ);
    if (deltaZ > this.potholeThreshold) {
      this.autoReport('pothole', deltaZ);
    }
    this.lastZ = acc.z;

    // 2. Sudden Braking Detection (Longitudinal Y-axis negative spike)
    if (acc.y < this.brakingThreshold) {
      this.autoReport('heavy_congestion', Math.abs(acc.y));
      realtime.reportSafetyEvent('hard_braking');
    }
  }

  private lastReportTime: number = 0;
  private readonly REPORT_COOLDOWN = 5000; // 5s cooldown to avoid spamming the same hazard

  private autoReport(type: string, intensity: number) {
    const now = Date.now();
    if (now - this.lastReportTime < this.REPORT_COOLDOWN) return;

    const pos = this.navSystem.getCurrentPosition();
    if (!pos) return;

    console.log(`[SensorIntelligence] AI DETECTED ${type.toUpperCase()} (Intensity: ${intensity.toFixed(2)})`);
    
    // Auto-broadcast to the tactical network
    realtime.reportHazard(type, pos);
    this.lastReportTime = now;
  }

  public stop() {
    window.removeEventListener('devicemotion', (event) => this.handleMotion(event));
    this.isMonitoring = false;
  }
}
