export interface RuleBasedResult {
    score: number;
    penalty: number;
    warnings: string[];
    trafficHitCount: number;
    trafficLevelSum: number;
    safetyZoneExposure: number;
    incidentCount: number;
}
export declare class RuleBasedScoringService {
}
