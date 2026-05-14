import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hazard, HazardSeverity } from '../hazards/hazard.entity';

@Injectable()
export class IntelligenceService {
  constructor(
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
  ) {}

  /**
   * Evaluates a route's safety and quality based on known hazards
   * @param coordinates Array of [lng, lat] coordinates
   * @returns Safety Index (0-100) and hazard summary
   */
  async scoreRoute(coordinates: [number, number][]) {
    if (coordinates.length < 2) return { score: 100, hazardsFound: 0 };

    // Create a LineString WKT from coordinates
    const lineStringWkt = `LINESTRING(${coordinates.map(c => `${c[0]} ${c[1]}`).join(',')})`;

    // Query hazards within 50 meters of the route corridor
    const hazards = await this.hazardsRepository
      .createQueryBuilder('hazard')
      .where(
        `ST_DWithin(
          hazard.location, 
          ST_GeomFromText(:wkt, 4326), 
          :buffer
        )`,
        { wkt: lineStringWkt, buffer: 0.0005 } // ~50m buffer
      )
      .getMany();

    // Calculate Penalty
    let penalty = 0;
    hazards.forEach(h => {
      switch (h.severity) {
        case HazardSeverity.CRITICAL: penalty += 20; break;
        case HazardSeverity.WARNING: penalty += 10; break;
        case HazardSeverity.INFO: penalty += 5; break;
      }
    });

    const score = Math.max(0, 100 - penalty);
    
    return {
      score,
      hazardsFound: hazards.length,
      criticalHazards: hazards.filter(h => h.severity === HazardSeverity.CRITICAL).length,
      potholes: hazards.filter(h => h.type === 'pothole').length,
      details: hazards.map(h => ({
        id: h.id,
        type: h.type,
        severity: h.severity,
        location: h.location.coordinates
      }))
    };
  }
}
