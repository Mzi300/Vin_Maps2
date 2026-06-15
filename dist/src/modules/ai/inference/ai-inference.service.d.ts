export interface RawTripData {
    distanceKm: number;
    avgTrafficLevel: number;
    incidentCount: number;
    safetyZoneExposure: number;
    startTime: Date;
}
export declare class AIInferenceService {
    private readonly logger;
    constructor();
    calculateMLAdjustment(tripData: RawTripData): number;
}
