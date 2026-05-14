import { Repository } from 'typeorm';
import { Hazard, HazardSeverity } from '../hazards/hazard.entity';
export declare class IntelligenceService {
    private hazardsRepository;
    constructor(hazardsRepository: Repository<Hazard>);
    scoreRoute(coordinates: [number, number][]): Promise<{
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
            severity: HazardSeverity;
            location: any;
        }[];
    }>;
}
