import { RouteScoringAggregatorService } from './route-scoring-aggregator.service';
import { GeoService } from '../geo/geo.service';
export declare class RouteIntelligenceService {
    private readonly aggregatorService;
    private readonly geoService;
    private readonly logger;
    private readonly routeCache;
    constructor(aggregatorService: RouteScoringAggregatorService, geoService: GeoService);
    calculateSmartRoutes(startLat: number, startLng: number, endLat: number, endLng: number, userId: number): Promise<any>;
    private mockCandidate;
}
