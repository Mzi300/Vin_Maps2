import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../modules/analytics/analytics.service';

/**
 * Global analytics middleware that records each incoming request.
 * It captures the endpoint path, HTTP method, optional authenticated user ID,
 * and if present, `origin`/`destination` fields from the request body (used by routing endpoints).
 */
@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    // Proceed to the next handler first
    next();
    // After response is finished, record analytics asynchronously
    res.on('finish', async () => {
      const duration = Date.now() - start;
      const entry = {
        endpoint: `${req.method} ${req.route?.path || req.path}`,
        userId: (req as any).user?.id,
        origin: (req.body && (req.body.origin || req.body.originLat)) || undefined,
        destination: (req.body && (req.body.destination || req.body.destLat)) || undefined,
        responseTimeMs: duration,
        status: res.statusCode,
      };
      try {
        await this.analyticsService.record(entry);
      } catch (e) {
        // swallow analytics errors to avoid breaking the request flow
        console.error('Analytics recording failed:', e);
      }
    });
  }
}
