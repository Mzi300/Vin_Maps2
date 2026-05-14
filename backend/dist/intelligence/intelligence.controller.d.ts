import { IntelligenceService } from './intelligence.service';
export declare class IntelligenceController {
    private readonly intelligenceService;
    constructor(intelligenceService: IntelligenceService);
    scoreRoute(body: {
        coordinates: [number, number][];
    }): Promise<{
        score: number;
        hazardsFound: number;
        criticalHazards?: undefined;
        potholes?: undefined;
        details?: undefined;
    } | {
        score: number;
        hazardsFound: number;
        criticalHazards: number;
        potholes: number;
        details: {
            id: string;
            type: import("../hazards/hazard.entity").HazardType;
            severity: import("../hazards/hazard.entity").HazardSeverity;
            location: any;
        }[];
    }>;
}
