export interface RouteCandidate {
    id: string;
    distanceKm: number;
    centerLat: number;
    centerLng: number;
}
export interface EvaluatedRoute {
    routeId: string;
    distance: number;
    eta: number;
    ruleBasedScore: number;
    mlScore: number;
    finalScore: number;
    riskLevel: string;
    warnings: string[];
    confidenceScore?: number;
    anomalyFlags?: string[];
    congestionForecast?: any;
    explanation?: string;
    arbitrationDetails?: any;
    systemMode?: 'NORMAL' | 'DEGRADED';
}
