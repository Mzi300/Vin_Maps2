import { Injectable } from '@nestjs/common';
import { HistoricalTrafficDto } from './dto/historical-traffic.dto';

@Injectable()
export class TrafficService {
  // Returns mock historical traffic data for a given route.
  // In a real implementation this would call an external API (e.g., TomTom Traffic Stats).
  async getHistoricalTraffic(dto: HistoricalTrafficDto): Promise<any> {
    // Decode route coordinates from query param (expected JSON string)
    let routeCoords: [number, number][] = [];
    try {
      routeCoords = JSON.parse(dto.route);
    } catch (e) {
      // ignore parsing errors, keep empty
    }
    // Mock data: same coordinates with a random speedFactor per segment
    const data = routeCoords.map(coord => ({
      coordinate: coord,
      speedFactor: Math.random() * 0.5 + 0.75, // between 0.75 and 1.25
    }));
    return { points: data };
  }
}
