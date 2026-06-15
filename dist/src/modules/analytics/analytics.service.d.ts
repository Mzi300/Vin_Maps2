import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';
import { ConfigService } from '@nestjs/config';
export declare class AnalyticsService {
    private readonly analyticsRepository;
    private readonly configService;
    constructor(analyticsRepository: Repository<Analytics>, configService: ConfigService);
    record(entry: Partial<Analytics>): Promise<Analytics>;
    getUsageStats(start?: Date, end?: Date): Promise<any[]>;
    getPopularRoutes(start?: Date, end?: Date, limit?: number): Promise<any[]>;
    purgeOld(): Promise<void>;
}
