import { ApiUsageService } from './api-usage.service';
export declare class ApiUsageController {
    private readonly apiUsageService;
    constructor(apiUsageService: ApiUsageService);
    getReport(start?: string, end?: string): Promise<Record<string, Record<string, number>>>;
    getQuota(): Promise<{
        used: number;
        limit: number;
    }>;
}
