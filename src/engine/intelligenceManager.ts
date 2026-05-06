import { EventEmitter } from './eventEmitter';

export type IntelligenceType = 'accident' | 'roadblock' | 'weather' | 'outage' | 'infra';
export type Severity = 'low' | 'medium' | 'critical';

export interface IntelligenceUpdate {
  id: string;
  type: IntelligenceType;
  severity: Severity;
  location: [number, number];
  message: string;
  timestamp: number;
}

class IntelligenceManager extends EventEmitter {
  constructor() {
    super();
  }

  public generateRouteHazard(origin: [number, number], dest: [number, number]) {
    const types: IntelligenceType[] = ['accident', 'roadblock', 'infra'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const messages = {
      accident: 'Collision detected on transit artery.',
      roadblock: 'SAPS Roadblock / Checkpoint identified.',
      weather: 'Heavy precipitation reducing visibility.',
      outage: 'Grid failure detected. Traffic lights non-functional.',
      infra: 'Structural anomaly detected on overpass.'
    };

    // Calculate a point exactly along the path (e.g., 40% of the way to the destination)
    const factor = 0.4;
    const hazardLocation: [number, number] = [
      origin[0] + (dest[0] - origin[0]) * factor,
      origin[1] + (dest[1] - origin[1]) * factor
    ];

    const update: IntelligenceUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      severity: 'critical',
      location: hazardLocation,
      message: messages[type],
      timestamp: Date.now()
    };

    this.emit('intelligence-update', update);
  }
}

export const intelligence = new IntelligenceManager();
