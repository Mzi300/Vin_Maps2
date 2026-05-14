import { systemMonitor } from './systemMonitor';

export interface TrafficSignal {
  id: string;
  location: [number, number];
  state: 'red' | 'green' | 'yellow';
  timeRemaining: number;
}

export class SmartCityService {
  private static instance: SmartCityService;
  private signals: Map<string, TrafficSignal> = new Map();
  private onUpdate?: (signals: TrafficSignal[]) => void;

  private constructor() {
    this.startPolling();
  }

  public static getInstance(): SmartCityService {
    if (!SmartCityService.instance) {
      SmartCityService.instance = new SmartCityService();
    }
    return SmartCityService.instance;
  }

  public onSignalUpdate(callback: (signals: TrafficSignal[]) => void) {
    this.onUpdate = callback;
  }

  private async startPolling() {
    // Poll every 3 seconds for infrastructure updates
    setInterval(async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${backendUrl}/smart-city/signals`);
        if (res.ok) {
          const signals = await res.json();
          this.signals = new Map(signals.map((s: any) => [s.id, s]));
          if (this.onUpdate) this.onUpdate(Array.from(this.signals.values()));
        }
      } catch (e) {
        // Fallback: Generate simulated local signals if backend is offline (Degraded Mode)
        this.generateSimulatedSignals();
      }
    }, 3000);
  }

  private generateSimulatedSignals() {
    // In degraded mode, we simulate local signal patterns
    const mockSignals: TrafficSignal[] = [
      { id: 'sig-1', location: [28.048, -26.205], state: Math.random() > 0.5 ? 'green' : 'red', timeRemaining: 15 },
      { id: 'sig-2', location: [28.050, -26.208], state: Math.random() > 0.5 ? 'green' : 'red', timeRemaining: 10 }
    ];
    if (this.onUpdate) this.onUpdate(mockSignals);
  }
}

export const smartCity = SmartCityService.getInstance();
