"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RouteIntelligenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteIntelligenceService = void 0;
const common_1 = require("@nestjs/common");
const route_scoring_aggregator_service_1 = require("./route-scoring-aggregator.service");
const geo_service_1 = require("../geo/geo.service");
const crypto_1 = require("crypto");
let RouteIntelligenceService = RouteIntelligenceService_1 = class RouteIntelligenceService {
    aggregatorService;
    geoService;
    logger = new common_1.Logger(RouteIntelligenceService_1.name);
    routeCache = new Map();
    constructor(aggregatorService, geoService) {
        this.aggregatorService = aggregatorService;
        this.geoService = geoService;
    }
    async calculateSmartRoutes(startLat, startLng, endLat, endLng, userId) {
        const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}_${endLat.toFixed(4)},${endLng.toFixed(4)}`;
        const cached = this.routeCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < 30000)) {
            this.logger.log(`Serving cached routing response for ${cacheKey}`);
            return cached.data;
        }
        const candidates = [
            this.mockCandidate(startLat, startLng, endLat, endLng, 0),
            this.mockCandidate(startLat, startLng, endLat, endLng, 0.05),
            this.mockCandidate(startLat, startLng, endLat, endLng, -0.05)
        ];
        const evaluatedRoutes = await Promise.all(candidates.map(c => this.aggregatorService.evaluateRoute(c, userId)));
        evaluatedRoutes.sort((a, b) => b.finalScore - a.finalScore);
        this.logger.log(`Calculated ${evaluatedRoutes.length} smart routes. Best final score: ${evaluatedRoutes[0].finalScore}`);
        const response = { routes: evaluatedRoutes };
        this.routeCache.set(cacheKey, { timestamp: Date.now(), data: response });
        return response;
    }
    mockCandidate(lat1, lng1, lat2, lng2, detourOffset) {
        const distanceMeters = this.geoService.calculateDistance(lat1, lng1, lat2, lng2);
        const midLat = (lat1 + lat2) / 2 + detourOffset;
        const midLng = (lng1 + lng2) / 2 + detourOffset;
        return {
            id: (0, crypto_1.randomUUID)(),
            distanceKm: distanceMeters / 1000,
            centerLat: midLat,
            centerLng: midLng,
        };
    }
};
exports.RouteIntelligenceService = RouteIntelligenceService;
exports.RouteIntelligenceService = RouteIntelligenceService = RouteIntelligenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [route_scoring_aggregator_service_1.RouteScoringAggregatorService,
        geo_service_1.GeoService])
], RouteIntelligenceService);
//# sourceMappingURL=route-intelligence.service.js.map