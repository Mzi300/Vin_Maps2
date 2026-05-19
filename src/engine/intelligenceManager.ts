import { EventEmitter } from './eventEmitter';

export type IntelligenceType = 'accident' | 'roadblock' | 'weather' | 'outage' | 'infra' | 'hazard' | 'safety';
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
  // PHASE 6: SOUTH AFRICAN LOCALIZATION MAPPING
  private saDictionary: Record<string, string> = {
    'robot': 'traffic light',
    'robots': 'traffic lights',
    'garage': 'petrol station',
    'rank': 'taxi rank',
    'kasi': 'township',
    'spaza': 'local shop',
    'cbd': 'city center',
    'shisanyama': 'braai restaurant',
    'saps': 'police station',
    'metro': 'metro police',
    'gautrain': 'train station',
    'uj': 'university of johannesburg',
    'wits': 'university of the witwatersrand',
    'up': 'university of pretoria',
    'tut': 'tshwane university of technology',
    'cput': 'cape peninsula university of technology',
    'unisa': 'university of south africa',
    'ukzn': 'university of kwazulu-natal'
  };

  constructor() {
    super();
  }

  // PHASE 5 & 6: AI INTENT & LOCALIZATION ENGINE
  public processQuery(query: string): { translatedQuery: string, intent: string, category?: string } {
    const lowerQuery = query.toLowerCase();
    let translated = lowerQuery;
    let intent = 'search';
    let category: string | undefined;

    // 1. Translate SA terminology
    for (const [slang, formal] of Object.entries(this.saDictionary)) {
      if (translated.includes(slang)) {
        translated = translated.replace(new RegExp(`\\b${slang}\\b`, 'g'), formal);
      }
    }

    // 2. Detect Intent & Categories (Phase 2 & 3)
    if (lowerQuery.includes('near me') || lowerQuery.includes('nearby') || lowerQuery.includes('around')) {
      intent = 'nearby_search';
    }

    const categories: Record<string, string> = {
      'food': 'restaurant',
      'eat': 'restaurant',
      'shisanyama': 'restaurant',
      'fuel': 'gas_station',
      'petrol': 'gas_station',
      'garage': 'gas_station',
      'police': 'police',
      'saps': 'police',
      'clinic': 'hospital',
      'doctor': 'hospital',
      'hospital': 'hospital',
      'rank': 'bus_station',
      'taxi': 'bus_station',
      'atm': 'atm',
      'bank': 'bank',
      'shop': 'store',
      'spaza': 'store',
      'mall': 'shopping_mall',
      'school': 'education',
      'university': 'education',
      'varsity': 'education',
      'college': 'education'
    };

    for (const [key, cat] of Object.entries(categories)) {
      if (lowerQuery.includes(key)) {
        category = cat;
        break;
      }
    }

    return { translatedQuery: translated, intent, category };
  }

  public generateRouteHazard(origin: [number, number], dest: [number, number]) {
    const types: IntelligenceType[] = ['accident', 'roadblock', 'infra'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const messages = {
      accident: 'Collision detected on transit artery.',
      roadblock: 'SAPS Roadblock / Checkpoint identified.',
      weather: 'Heavy precipitation reducing visibility.',
      outage: 'Grid failure detected. Traffic lights non-functional.',
      infra: 'Structural anomaly detected on overpass.',
      hazard: 'Road hazard reported ahead.',
      safety: 'Caution: Entering high-risk sector.'
    };

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
      message: messages[type] || 'Intelligence update received.',
      timestamp: Date.now()
    };

    this.emit('intelligence-update', update);
  }

  public report(data: any) {
    const update: IntelligenceUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      type: data.payload.type as IntelligenceType,
      severity: 'medium',
      location: data.payload.location,
      message: `User Reported: ${data.payload.type.toUpperCase()}`,
      timestamp: data.timestamp
    };
    this.emit('intelligence-update', update);
  }

  public generateTacticalBriefing(route: any, transportType: string): { brief: string } {
    const distanceKm = (route.distance / 1000).toFixed(1);
    const timeMins = Math.round(route.duration / 60);
    const brief = `Tactical route established. Covering ${distanceKm} kilometers via ${transportType}. Estimated extraction time: ${timeMins} minutes. Sector conditions: Dynamic.`;
    return { brief };
  }
}

export const intelligence = new IntelligenceManager();
