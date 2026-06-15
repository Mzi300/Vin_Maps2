import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private readonly cs;
    private readonly env;
    constructor(cs: NestConfigService);
    getMapboxToken(): string;
    getTrafficApiKey(): string;
}
