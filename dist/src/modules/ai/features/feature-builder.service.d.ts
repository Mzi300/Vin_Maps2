import { RouteUsageLog } from '../learning/route-usage-log.entity';
export declare class FeatureBuilderService {
    buildFeatures(log: RouteUsageLog): {
        distanceKm: number;
        avgTrafficLevel: any;
        incidentCount: any;
        safetyZoneExposure: any;
        timeOfDay: number;
        dayOfWeek: number;
    };
}
