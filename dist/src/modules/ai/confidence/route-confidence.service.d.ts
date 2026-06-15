export interface RouteConfidenceOutput {
    routeId: string;
    confidenceScore: number;
    uncertaintyFactors: string[];
}
export declare class RouteConfidenceService {
    calculateConfidence(routeId: string, ruleScore: number, mlScore: number, hasAnomaly: boolean, temporalRisk: number): Promise<RouteConfidenceOutput>;
}
