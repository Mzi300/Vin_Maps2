import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validateSync, IsString, IsNotEmpty } from 'class-validator';

class EnvVars {
  @IsString()
  @IsNotEmpty()
  MAPBOX_TOKEN: string;

  @IsString()
  @IsNotEmpty()
  TRAFFIC_API_KEY: string;
}

@Injectable()
export class ConfigService {
  private readonly env: EnvVars;

  constructor(private readonly cs: NestConfigService) {
    this.env = plainToClass(EnvVars, {
      MAPBOX_TOKEN: cs.get<string>('MAPBOX_TOKEN'),
      TRAFFIC_API_KEY: cs.get<string>('TRAFFIC_API_KEY'),
    });
    const errors = validateSync(this.env);
    if (errors.length) {
      throw new Error('Missing required environment variables: ' + errors.map(e => e.property).join(', '));
    }
  }

  getMapboxToken(): string {
    return this.env.MAPBOX_TOKEN;
  }

  getTrafficApiKey(): string {
    return this.env.TRAFFIC_API_KEY;
  }
}
