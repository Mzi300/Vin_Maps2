import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';

@Controller('analytics')
@UseGuards(AdminAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('usage')
  async getUsage(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.analyticsService.getUsageStats(startDate, endDate);
  }

  @Get('popular-routes')
  async getPopularRoutes(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const lim = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getPopularRoutes(startDate, endDate, lim);
  }
}
