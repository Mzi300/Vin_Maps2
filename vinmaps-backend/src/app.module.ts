
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dataSourceOptions } from './database/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyGuard } from './api-key.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoutingModule } from './modules/routing/routing.module';
import { TrafficModule } from './modules/traffic/traffic.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { GeoModule } from './modules/geo/geo.module';
import { SafetyZonesModule } from './modules/safety-zones/safety-zones.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { HealthModule } from './modules/health/health.module';
import { VerificationModule } from './modules/verification/verification.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppCacheModule } from './cache/cache.module';
import { ObservabilityModule } from './observability/observability.module';

import { envValidationSchema } from './config/env.validation';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      load: [jwtConfig],
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...dataSourceOptions,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    RoutingModule,
    TrafficModule,
    IncidentsModule,
    GeoModule,
    SafetyZonesModule,
    TelemetryModule,
    HealthModule,
    VerificationModule,
    NotificationsModule,
    ObservabilityModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {}
