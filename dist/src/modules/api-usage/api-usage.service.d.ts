import { Repository } from 'typeorm';
import { ApiUsage } from './entities/api-usage.entity';
import { ConfigService } from '@nestjs/config';
export declare class ApiUsageService {
    private readonly repo;
    private readonly configService;
    private readonly quotaDaily;
    private readonly retentionDays;
    constructor(repo: Repository<ApiUsage>, configService: ConfigService);
    record(dto: Partial<ApiUsage>): Promise<ApiUsage>;
    increment(apiName: string, endpoint: string, userId?: string): Promise<ApiUsage>;
    getReport(start?: Date, end?: Date): Promise<Record<string, Record<string, number>>>;
    getQuotaStatus(): Promise<{
        used: number;
        limit: number;
    }>;
    enforceQuota(): Promise<void>;
    cleanupOldRecords(): Promise<void>;
}
