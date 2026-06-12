import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyZone } from './entities/safety-zone.entity';
import { SafetyZonesService } from './safety-zones.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyZone])],
  providers: [SafetyZonesService],
  exports: [SafetyZonesService],
})
export class SafetyZonesModule {}
