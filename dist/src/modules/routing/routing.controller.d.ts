import { Request } from 'express';
import { RouteIntelligenceService } from './route-intelligence.service';
import { OutcomeTrackerService } from '../ai/learning/outcome-tracker.service';
export declare class RoutingController {
    private readonly routeIntelligenceService;
    private readonly outcomeTrackerService;
    constructor(routeIntelligenceService: RouteIntelligenceService, outcomeTrackerService: OutcomeTrackerService);
    getSmartRoutes(start: string, end: string, req: Request): Promise<any>;
    completeTrip(payload: any): Promise<import("../ai/learning/route-usage-log.entity").RouteUsageLog>;
}
