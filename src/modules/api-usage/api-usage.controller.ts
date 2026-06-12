import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiUsageService } from './api-usage.service';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';

@Controller('api-usage')
@UseGuards(AdminAuthGuard)
export class ApiUsageController {
  constructor(private readonly apiUsageService: ApiUsageService) {}

  @Get('report')
  async getReport(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.apiUsageService.getReport(startDate, endDate);
  }

  @Get('quota')
  async getQuota() {
    return this.apiUsageService.getQuotaStatus();
  }
}
