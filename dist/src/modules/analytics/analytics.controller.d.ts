import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getUsage(start?: string, end?: string): Promise<any[]>;
    getPopularRoutes(start?: string, end?: string, limit?: string): Promise<any[]>;
}
