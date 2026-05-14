import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hazard } from '../hazards/hazard.entity';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hazard])],
  providers: [IntelligenceService],
  controllers: [IntelligenceController],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
