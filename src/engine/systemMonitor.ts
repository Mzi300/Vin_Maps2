export interface SystemStatus {
  linkStatus: 'online' | 'offline';
  gpsAccuracy: number;
  latency: number;
  activeHazards: number;
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  private backendUrl: string;
  private onUpdate?: (status: SystemStatus) => void;

  private currentStatus: SystemStatus = {
    linkStatus: 'offline',
    gpsAccuracy: 0,
    latency: 0,
    activeHazards: 0
  };

  private constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    this.startMonitoring();
  }

  public static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  public setUpdateCallback(callback: (status: SystemStatus) => void) {
    this.onUpdate = callback;
  }

  public updateGpsAccuracy(accuracy: number) {
    this.currentStatus.gpsAccuracy = accuracy;
    this.notify();
  }

  private async startMonitoring() {
    setInterval(async () => {
      const startTime = performance.now();
      try {
        const res = await fetch(`${this.backendUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          this.currentStatus.linkStatus = 'online';
          this.currentStatus.latency = Math.round(performance.now() - startTime);
          // Future: map other stats from health endpoint
        } else {
          this.currentStatus.linkStatus = 'offline';
        }
      } catch (e) {
        this.currentStatus.linkStatus = 'offline';
      }
      this.notify();
    }, 5000);
  }

  private notify() {
    if (this.onUpdate) this.onUpdate(this.currentStatus);
  }
}

export const systemMonitor = SystemMonitor.getInstance();
