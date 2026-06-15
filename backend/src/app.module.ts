import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HazardsModule } from './hazards/hazards.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { EmergencyModule } from './emergency/emergency.module';
import { FleetModule } from './fleet/fleet.module';
import { SmartCityModule } from './smart-city/smart-city.module';
import { AuthModule } from './auth/auth.module';
import { Hazard } from './hazards/hazard.entity';
import { DriverSession } from './fleet/driver-session.entity';
import { TrafficLight } from './smart-city/traffic-light.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // Allow using a lightweight SQLite fallback when POSTGRES is not available.
    // Set USE_SQLITE=true to enable (useful for local dev without Docker/Postgres).
    TypeOrmModule.forRoot(
      process.env.USE_SQLITE === 'true'
        ? {
            type: 'sqlite',
            database: process.env.SQLITE_DB_PATH || 'vinmaps.sqlite',
            entities: [Hazard, DriverSession, TrafficLight],
            synchronize: true,
            logging: true,
          }
        : {
            type: 'postgres',
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vinmaps',
            entities: [Hazard, DriverSession, TrafficLight],
            synchronize: true, // Auto-create tables (use migrations for production)
            logging: true,
          }
    ),
    HazardsModule,
    IntelligenceModule,
    EmergencyModule,
    FleetModule,
    SmartCityModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
