import { Module } from '@nestjs/common';
import { ObservabilityModule } from './observability/observability.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, NestModule, MiddlewareConsumer } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dataSourceOptions } from './database/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyGuard } from './api-key.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { PlacesModule } from './modules/places/places.module';
import { UsersModule } from './modules/users/users.module';
import { ApiUsageModule } from './modules/api-usage/api-usage.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiUsageMiddleware } from './modules/api-usage/api-usage.middleware';
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
import { VoiceModule } from './voice/voice.module';
import { PreferencesModule } from './preferences/preferences.module';

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
    ApiUsageModule,
    ScheduleModule.forRoot(),
    PlacesModule,
    PromotionsModule,
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
    AppCacheModule,
    VoiceModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(require('./middleware/analytics.middleware').default).forRoutes('*');
  },
})
export class AppModule {}
