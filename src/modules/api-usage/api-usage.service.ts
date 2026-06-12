import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ApiUsage } from './entities/api-usage.entity';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ApiUsageService {
  private readonly quotaDaily: number;
  private readonly retentionDays: number;

  constructor(
    @InjectRepository(ApiUsage)
    private readonly repo: Repository<ApiUsage>,
    private readonly configService: ConfigService,
  ) {
    this.quotaDaily = this.configService.get<number>('TOMTOM_QUOTA_DAILY') ?? 10000;
    this.retentionDays = this.configService.get<number>('API_USAGE_RETENTION_DAYS') ?? 90;
  }

  async record(dto: Partial<ApiUsage>): Promise<ApiUsage> {
    const usage = this.repo.create(dto);
    return this.repo.save(usage);
  }

  async increment(apiName: string, endpoint: string, userId?: string): Promise<ApiUsage> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const existing = await this.repo.findOne({
      where: {
        apiName,
        endpoint,
        userId: userId ?? null,
        date: Between(startOfDay, new Date()),
      },
    });
    if (existing) {
      existing.count += 1;
      return this.repo.save(existing);
    }
    const usage = this.repo.create({ apiName, endpoint, userId, count: 1, date: new Date() });
    return this.repo.save(usage);
  }

  async getReport(start?: Date, end?: Date) {
    const where: any = {};
    if (start && end) {
      where.date = Between(start, end);
    }
    const rows = await this.repo.find({ where });
    // aggregate by date and endpoint
    const report = rows.reduce((acc, cur) => {
      const dateKey = cur.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = {};
      if (!acc[dateKey][cur.endpoint]) acc[dateKey][cur.endpoint] = 0;
      acc[dateKey][cur.endpoint] += cur.count;
      return acc;
    }, {} as Record<string, Record<string, number>>);
    return report;
  }

  async getQuotaStatus(): Promise<{ used: number; limit: number }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const used = await this.repo.count({
      where: {
        apiName: 'TomTom',
        date: Between(startOfDay, new Date()),
      },
    });
    return { used, limit: this.quotaDaily };
  }

  async enforceQuota(): Promise<void> {
    const { used, limit } = await this.getQuotaStatus();
    if (used >= limit) {
      throw new ForbiddenException('TomTom daily quota exceeded');
    }
  }

  // Daily cleanup of old records
  @Cron('0 0 * * *')
  async cleanupOldRecords() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    await this.repo.delete({ date: Between(new Date('1970-01-01'), cutoff) });
  }
}
