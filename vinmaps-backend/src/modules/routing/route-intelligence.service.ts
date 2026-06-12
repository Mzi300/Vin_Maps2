import { Injectable, Logger } from '@nestjs/common';
import { RouteScoringAggregatorService } from './route-scoring-aggregator.service';
import { GeoService } from '../geo/geo.service';
import { RouteCandidate, EvaluatedRoute } from './interfaces/route-candidate.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class RouteIntelligenceService {
  private readonly logger = new Logger(RouteIntelligenceService.name);
  private readonly routeCache = new Map<string, { timestamp: number, data: any }>();

  constructor(
    private readonly aggregatorService: RouteScoringAggregatorService,
    private readonly geoService: GeoService,
  ) {}

  async calculateSmartRoutes(startLat: number, startLng: number, endLat: number, endLng: number) {
    const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}_${endLat.toFixed(4)},${endLng.toFixed(4)}`;
    
    // Check Cache (30 sec TTL)
    const cached = this.routeCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 30000)) {
      this.logger.log(`Serving cached routing response for ${cacheKey}`);
      return cached.data;
    }

    // 1. Generate Multiple Route Candidates
    const candidates: RouteCandidate[] = [
      this.mockCandidate(startLat, startLng, endLat, endLng, 0),    // Direct
      this.mockCandidate(startLat, startLng, endLat, endLng, 0.05), // Detour 1
      this.mockCandidate(startLat, startLng, endLat, endLng, -0.05) // Detour 2
    ];

    // 2. Evaluate all candidates via Aggregator (Rule Base + ML Base)
    const evaluatedRoutes: EvaluatedRoute[] = await Promise.all(
      candidates.map(c => this.aggregatorService.evaluateRoute(c))
    );

    // 3. Rank Routes
    evaluatedRoutes.sort((a, b) => b.finalScore - a.finalScore);

    this.logger.log(`Calculated ${evaluatedRoutes.length} smart routes. Best final score: ${evaluatedRoutes[0].finalScore}`);

    const response = { routes: evaluatedRoutes };
    this.routeCache.set(cacheKey, { timestamp: Date.now(), data: response });

    // 4. Return Best Routes
    return response;
  }

  private mockCandidate(lat1: number, lng1: number, lat2: number, lng2: number, detourOffset: number): RouteCandidate {
    const distanceMeters = this.geoService.calculateDistance(lat1, lng1, lat2, lng2);
    const midLat = (lat1 + lat2) / 2 + detourOffset;
    const midLng = (lng1 + lng2) / 2 + detourOffset;

    return {
      id: randomUUID(),
      distanceKm: distanceMeters / 1000,
      centerLat: midLat,
      centerLng: midLng,
    };
  }
}
