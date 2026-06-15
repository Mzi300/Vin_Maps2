import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../modules/analytics/analytics.service';
export declare class AnalyticsMiddleware implements NestMiddleware {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
