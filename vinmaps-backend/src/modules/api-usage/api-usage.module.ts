import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiUsageService } from './api-usage.service';
import { ApiUsageController } from './api-usage.controller';
import { ApiUsage } from './entities/api-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiUsage])],
  providers: [ApiUsageService],
  controllers: [ApiUsageController],
  exports: [ApiUsageService],
})
export class ApiUsageModule {}
