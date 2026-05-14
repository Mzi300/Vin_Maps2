import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hazard } from './hazard.entity';
import { HazardsService } from './hazards.service';
import { HazardsGateway } from './hazards.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Hazard])],
  providers: [HazardsService, HazardsGateway],
  exports: [HazardsService],
})
export class HazardsModule {}
