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
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
    if (!this.backendUrl) {
      this.currentStatus.linkStatus = 'offline';
      setTimeout(() => this.notify(), 100);
    } else {
      this.startMonitoring();
    }
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
    let failureCount = 0;
    
    const monitor = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch(`${this.backendUrl}/health`);
        if (res.ok) {
          await res.json();
          this.currentStatus.linkStatus = 'online';
          this.currentStatus.latency = Math.round(performance.now() - startTime);
          failureCount = 0;
        } else {
          this.currentStatus.linkStatus = 'offline';
          failureCount++;
        }
      } catch (e) {
        this.currentStatus.linkStatus = 'offline';
        failureCount++;
      }
      this.notify();
      
      const nextDelay = failureCount > 3 ? 30000 : 5000;
      setTimeout(monitor, nextDelay);
    };

    setTimeout(monitor, 1000);
  }

  private notify() {
    if (this.onUpdate) this.onUpdate(this.currentStatus);
  }
}

export const systemMonitor = SystemMonitor.getInstance();
