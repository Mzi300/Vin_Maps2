import { Injectable } from '@nestjs/common';
import { RouteUsageLog } from '../learning/route-usage-log.entity';

@Injectable()
export class FeatureBuilderService {
  buildFeatures(log: RouteUsageLog) {
    const hours = log.startTime?.getHours() || new Date().getHours();
    const dayOfWeek = log.startTime?.getDay() || new Date().getDay();

    const incidentCount = log.actualEvents ? log.actualEvents.length : 0;
    
    const avgTrafficLevel = log.routeScoreInputs?.avgTrafficLevel || 0;
    const safetyZoneExposure = log.routeScoreInputs?.safetyZoneExposure || 0;

    return {
      distanceKm: log.distanceKm,
      avgTrafficLevel,
      incidentCount,
      safetyZoneExposure,
      timeOfDay: hours,
      dayOfWeek: dayOfWeek,
    };
  }
}
