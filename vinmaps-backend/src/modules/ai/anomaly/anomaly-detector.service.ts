import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  async detectAnomaly(densityChange: number, speedDrop: number, activeIncidents: number): Promise<boolean> {
    const isSpike = densityChange > 50; // Density increased by >50 vehicles instantly
    const isSpeedCollapse = speedDrop > 30; // Speed dropped by >30 km/h instantly
    const isClusteredIncident = activeIncidents > 2; // >2 incidents in close proximity

    if (isSpike || isSpeedCollapse || isClusteredIncident) {
      this.logger.warn(`Anomaly Detected: densityChange=${densityChange}, speedDrop=${speedDrop}, incidents=${activeIncidents}`);
      
      this.eventEmitter.emit('anomaly.detected', {
        type: 'REAL_TIME_ANOMALY_ALERT',
        timestamp: new Date().toISOString(),
        details: { densityChange, speedDrop, activeIncidents }
      });
      return true;
    }
    
    return false;
  }
}
