"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleBasedScoringService = void 0;
const common_1 = require("@nestjs/common");
const incidents_service_1 = require("../incidents/incidents.service");
const telemetry_clustering_service_1 = require("../telemetry/telemetry-clustering.service");
const safety_zones_service_1 = require("../safety-zones/safety-zones.service");
const geo_service_1 = require("../geo/geo.service");
let RuleBasedScoringService = class RuleBasedScoringService {
};
exports.RuleBasedScoringService = RuleBasedScoringService;
exports.RuleBasedScoringService = RuleBasedScoringService = __decorate([
    (0, common_1.Injectable)()
], RuleBasedScoringService);
const preferences_service_1 = require("../../preferences/preferences.service");
constructor(private, readonly, incidentsService, incidents_service_1.IncidentsService, private, readonly, clusteringService, telemetry_clustering_service_1.TelemetryClusteringService, private, readonly, safetyZonesService, safety_zones_service_1.SafetyZonesService, private, readonly, geoService, geo_service_1.GeoService, private, readonly, preferencesService, preferences_service_1.PreferencesService);
{ }
async;
evaluateCandidate(route, route_candidate_interface_1.RouteCandidate, userId, number);
Promise < RuleBasedResult > {
    const: prefs = await this.preferencesService.findOne(userId).catch(() => null),
    let, penalty = 0,
    const: warnings, string, []:  = [],
    const: radiusKm = (route.distanceKm / 2) + 2,
    let, trafficHitCount = 0,
    let, trafficLevelSum = 0,
    let, safetyZoneExposure = 0,
    const: nearbyIncidents = await this.incidentsService.findNearby(route.centerLat, route.centerLng, radiusKm),
    for(, incident, of, nearbyIncidents) {
        switch (incident.type) {
            case 'POTHOLE':
                penalty += 2;
                warnings.push('POTHOLE AHEAD');
                break;
            case 'ROAD_HAZARD':
                penalty += 3;
                warnings.push('HAZARD AHEAD');
                break;
            case 'ACCIDENT':
                penalty += 5;
                warnings.push('ACCIDENT AHEAD');
                break;
            case 'ROAD_CLOSURE':
                penalty += 10;
                warnings.push('ROAD CLOSURE AHEAD');
                break;
            case 'POLICE_CHECKPOINT':
                penalty += 1;
                warnings.push('POLICE CHECKPOINT');
                break;
            case 'FLOOD':
                penalty += 6;
                warnings.push('FLOOD ZONE');
                break;
        }
    },
    const: activeClusters = this.clusteringService.getActiveClusters(),
    for(, cluster, of, activeClusters) {
        if (this.geoService.isWithinRadius(route.centerLat, route.centerLng, cluster.centerLat, cluster.centerLng, radiusKm * 1000)) {
            trafficHitCount++;
            switch (cluster.trafficLevel) {
                case 'AVERAGE':
                    penalty += 2;
                    trafficLevelSum += 1;
                    break;
                case 'HIGH':
                    penalty += 5;
                    warnings.push('HIGH TRAFFIC ZONE');
                    trafficLevelSum += 2;
                    break;
                case 'CONGESTION':
                    penalty += 10;
                    warnings.push('SEVERE CONGESTION');
                    trafficLevelSum += 3;
                    break;
                case 'PREDICTED_CONGESTION':
                    penalty += 8;
                    warnings.push('PREDICTED CONGESTION');
                    trafficLevelSum += 3;
                    break;
            }
        }
    },
    const: activeZones = await this.safetyZonesService.findZonesNearPoint(route.centerLat, route.centerLng, radiusKm * 1000),
    for(, zone, of, activeZones) {
        if (this.safetyZonesService.isZoneActive(zone)) {
            safetyZoneExposure++;
            if (zone.type === 'SCHOOL') {
                penalty += 8;
                warnings.push('SCHOOL ZONE');
            }
            else if (zone.type === 'CRIME') {
                if (zone.riskLevel === 'HIGH' || zone.riskLevel === 'CRITICAL')
                    penalty += 10;
                else
                    penalty += 5;
                warnings.push('CRIME RISK ZONE');
            }
            else if (zone.type === 'ENVIRONMENT') {
                penalty += 9;
                warnings.push('ENVIRONMENTAL HAZARD');
            }
        }
    },
    const: distancePenalty = route.distanceKm * 1,
    penalty, distancePenalty,
    if(prefs) {
        const speedDiff = Math.abs(prefs.preferredSpeedKmh - 80);
        penalty += speedDiff * 0.1;
        let vehicleMultiplier = 1;
        if (prefs.vehicleType === 'truck') {
            vehicleMultiplier = 1.2;
        }
        else if (prefs.vehicleType === 'motorcycle') {
            vehicleMultiplier = 0.8;
        }
        const nonDistancePenalty = penalty - distancePenalty;
        penalty = nonDistancePenalty * vehicleMultiplier + distancePenalty;
        if (prefs.avoidTolls) {
            const hasToll = nearbyIncidents.some(i => i.type === 'POLICE_CHECKPOINT');
            if (hasToll) {
                penalty += 2;
            }
        }
    },
    let, score = 100 - penalty,
    if(score, , ) { }, score = 0,
    return: {
        score: Math.round(score),
        penalty,
        warnings: Array.from(new Set(warnings)),
        trafficHitCount,
        trafficLevelSum,
        safetyZoneExposure,
        incidentCount: nearbyIncidents.length,
    }
};
//# sourceMappingURL=rule-based-scoring.service.js.map