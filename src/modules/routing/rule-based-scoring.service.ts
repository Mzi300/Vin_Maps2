import { Injectable } from '@nestjs/common';
import { IncidentsService } from '../incidents/incidents.service';
import { TelemetryClusteringService } from '../telemetry/telemetry-clustering.service';
import { SafetyZonesService } from '../safety-zones/safety-zones.service';
import { GeoService } from '../geo/geo.service';
import { RouteCandidate } from './interfaces/route-candidate.interface';

export interface RuleBasedResult {
  score: number;
  penalty: number;
  warnings: string[];
  trafficHitCount: number;
  trafficLevelSum: number;
  safetyZoneExposure: number;
  incidentCount: number;
}

@Injectable()
export class RuleBasedScoringService {
import { PreferencesService } from '../../preferences/preferences.service';

  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly clusteringService: TelemetryClusteringService,
    private readonly safetyZonesService: SafetyZonesService,
    private readonly geoService: GeoService,
    private readonly preferencesService: PreferencesService,
  ) {}

  async evaluateCandidate(route: RouteCandidate, userId: number): Promise<RuleBasedResult> {
    // Fetch user preferences
    const prefs = await this.preferencesService.findOne(userId).catch(() => null);
    let penalty = 0;
    const warnings: string[] = [];
    const radiusKm = (route.distanceKm / 2) + 2;

    // Existing logic unchanged (incidents, traffic, safety zones)
    // ... (the rest of the method will be updated below)
    
    let trafficHitCount = 0;
    let trafficLevelSum = 0;
    let safetyZoneExposure = 0;

    const nearbyIncidents = await this.incidentsService.findNearby(route.centerLat, route.centerLng, radiusKm);
    for (const incident of nearbyIncidents) {
      switch (incident.type) {
        case 'POTHOLE': penalty += 2; warnings.push('POTHOLE AHEAD'); break;
        case 'ROAD_HAZARD': penalty += 3; warnings.push('HAZARD AHEAD'); break;
        case 'ACCIDENT': penalty += 5; warnings.push('ACCIDENT AHEAD'); break;
        case 'ROAD_CLOSURE': penalty += 10; warnings.push('ROAD CLOSURE AHEAD'); break;
        case 'POLICE_CHECKPOINT': penalty += 1; warnings.push('POLICE CHECKPOINT'); break;
        case 'FLOOD': penalty += 6; warnings.push('FLOOD ZONE'); break;
      }
    }

    const activeClusters = this.clusteringService.getActiveClusters();
    for (const cluster of activeClusters) {
      if (this.geoService.isWithinRadius(route.centerLat, route.centerLng, cluster.centerLat, cluster.centerLng, radiusKm * 1000)) {
        trafficHitCount++;
        switch (cluster.trafficLevel) {
          case 'AVERAGE': penalty += 2; trafficLevelSum += 1; break;
          case 'HIGH': penalty += 5; warnings.push('HIGH TRAFFIC ZONE'); trafficLevelSum += 2; break;
          case 'CONGESTION': penalty += 10; warnings.push('SEVERE CONGESTION'); trafficLevelSum += 3; break;
          case 'PREDICTED_CONGESTION': penalty += 8; warnings.push('PREDICTED CONGESTION'); trafficLevelSum += 3; break;
        }
      }
    }

    const activeZones = await this.safetyZonesService.findZonesNearPoint(route.centerLat, route.centerLng, radiusKm * 1000);
    for (const zone of activeZones) {
      if (this.safetyZonesService.isZoneActive(zone)) {
        safetyZoneExposure++;
        if (zone.type === 'SCHOOL') { 
          penalty += 8; 
          warnings.push('SCHOOL ZONE'); 
        } else if (zone.type === 'CRIME') {
          if (zone.riskLevel === 'HIGH' || zone.riskLevel === 'CRITICAL') penalty += 10;
          else penalty += 5;
          warnings.push('CRIME RISK ZONE');
        } else if (zone.type === 'ENVIRONMENT') {
           penalty += 9; 
           warnings.push('ENVIRONMENTAL HAZARD');
        }
      }
    }

    // Apply distance penalty (base)
    const distancePenalty = route.distanceKm * 1;
    penalty += distancePenalty;

    // Apply user preferences if available
    if (prefs) {
      // Preferred speed deviation penalty (small weight)
      const speedDiff = Math.abs(prefs.preferredSpeedKmh - 80);
      penalty += speedDiff * 0.1;

      // Vehicle type multiplier (affects all non‑distance penalties)
      let vehicleMultiplier = 1;
      if (prefs.vehicleType === 'truck') {
        vehicleMultiplier = 1.2;
      } else if (prefs.vehicleType === 'motorcycle') {
        vehicleMultiplier = 0.8;
      }
      // Apply multiplier to the part of the penalty that isn't distance based
      const nonDistancePenalty = penalty - distancePenalty;
      penalty = nonDistancePenalty * vehicleMultiplier + distancePenalty;

      // Avoid tolls: add a small penalty if a police checkpoint (used as proxy for toll) was encountered
      if (prefs.avoidTolls) {
        const hasToll = nearbyIncidents.some(i => i.type === 'POLICE_CHECKPOINT');
        if (hasToll) {
          penalty += 2; // modest extra penalty for toll avoidance
        }
      }
    }

    // Compute final score
    let score = 100 - penalty;
    if (score < 0) score = 0;

    return {
      score: Math.round(score),
      penalty,
      warnings: Array.from(new Set(warnings)),
      trafficHitCount,
      trafficLevelSum,
      safetyZoneExposure,
      incidentCount: nearbyIncidents.length,
    };
  }
}
