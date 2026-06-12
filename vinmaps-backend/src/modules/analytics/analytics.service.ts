import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';
import { ConfigService } from '@nestjs/config';
import { subDays } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
    private readonly configService: ConfigService,
  ) {}

  /** Record a new analytics entry */
  async record(entry: Partial<Analytics>): Promise<Analytics> {
    const analytics = this.analyticsRepository.create(entry);
    return this.analyticsRepository.save(analytics);
  }

  /** Get usage statistics grouped by day */
  async getUsageStats(start?: Date, end?: Date) {
    const qb = this.analyticsRepository
      .createQueryBuilder('a')
      .select("DATE_TRUNC('day', a.timestamp)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (start) qb.andWhere('a.timestamp >= :start', { start });
    if (end) qb.andWhere('a.timestamp <= :end', { end });

    return qb.getRawMany();
  }

  /** Get most popular routes (origin -> destination) */
  async getPopularRoutes(start?: Date, end?: Date, limit = 10) {
    const qb = this.analyticsRepository
      .createQueryBuilder('a')
      .select('a.origin', 'origin')
      .addSelect('a.destination', 'destination')
      .addSelect('COUNT(*)', 'count')
      .where('a.origin IS NOT NULL')
      .andWhere('a.destination IS NOT NULL')
      .groupBy('a.origin')
      .addGroupBy('a.destination')
      .orderBy('count', 'DESC')
      .limit(limit);

    if (start) qb.andWhere('a.timestamp >= :start', { start });
    if (end) qb.andWhere('a.timestamp <= :end', { end });

    return qb.getRawMany();
  }

  /** Purge old analytics based on retention days */
  async purgeOld() {
    const retention = this.configService.get<number>('ANALYTICS_RETENTION_DAYS') || 30;
    const cutoff = subDays(new Date(), retention);
    await this.analyticsRepository.delete({ timestamp: { $lt: cutoff } } as any);
  }
}
