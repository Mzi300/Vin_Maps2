import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrafficLight } from './traffic-light.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrafficLight])],
  providers: [],
  controllers: [],
  exports: [],
})
export class SmartCityModule {}
