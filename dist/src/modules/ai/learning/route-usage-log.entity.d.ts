export declare class RouteUsageLog {
    id: string;
    userId: string;
    routeId: string;
    startTime: Date;
    endTime: Date;
    distanceKm: number;
    predictedEtaMinutes: number;
    actualEtaMinutes: number;
    ruleBasedScore: number;
    mlAdjustmentScore: number;
    efficiencyScore: number;
    predictedSafetyScore: number;
    features: any;
    actualEvents: any;
    congestionLevel: number;
    routeScoreInputs: any;
    timestamp: Date;
}
