import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dataSourceOptions } from './database/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { AiModule } from './modules/ai/ai.module';

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
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
