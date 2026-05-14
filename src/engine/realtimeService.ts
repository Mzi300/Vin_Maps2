import { io, Socket } from 'socket.io-client';
import { intelligence } from './intelligenceManager';

export class RealtimeService {
  private socket: Socket;
  private static instance: RealtimeService;

  private constructor() {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    this.socket = io(backendUrl);

    this.socket.on('connect', () => {
      console.log('[RealtimeService] Tactical link established');
    });

    this.socket.on('hazard-update', (hazard) => {
      console.log('[RealtimeService] Incoming Hazard Intelligence:', hazard);
      // Integrate with the Intelligence Manager
      intelligence.report({
        type: 'HAZARD',
        payload: {
          type: hazard.type,
          location: [hazard.location.coordinates[0], hazard.location.coordinates[1]],
          severity: hazard.severity,
          id: hazard.id
        },
        timestamp: Date.now()
      });
      
      // Emit a custom event for the UI/Map to react
      window.dispatchEvent(new CustomEvent('realtime-hazard', { detail: hazard }));
    });

    this.socket.on('sos-broadcast', (sos) => {
      console.error('[RealtimeService] INCOMING SOS ALERT:', sos);
      window.dispatchEvent(new CustomEvent('tactical-sos', { detail: sos }));
    });
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public triggerSOS(location: [number, number]) {
    this.socket.emit('trigger-sos', {
      location,
      timestamp: Date.now()
    });
  }

  public reportSafetyEvent(type: string) {
    this.socket.emit('safety-event', { type });
  }

  public reportHazard(type: string, location: [number, number]) {
    const anonymized = this.anonymizeLocation(location);
    this.socket.emit('report-hazard', {
      type,
      lng: anonymized[0],
      lat: anonymized[1],
      severity: 'warning',
      source: 'Operator-Field-Report'
    });
  }

  private isStealthMode: boolean = false;

  public setStealthMode(active: boolean) {
    this.isStealthMode = active;
    console.log(`[RealtimeService] Tactical Stealth Mode: ${active ? 'ENABLED' : 'DISABLED'}`);
  }

  private anonymizeLocation(pos: [number, number]): [number, number] {
    // Standard offset (~3m) vs Stealth offset (~50m) for privacy (Requirement 4)
    const offset = this.isStealthMode ? 0.0005 : 0.00003; 
    return [
      pos[0] + (Math.random() - 0.5) * offset,
      pos[1] + (Math.random() - 0.5) * offset
    ];
  }
}

export const realtime = RealtimeService.getInstance();
