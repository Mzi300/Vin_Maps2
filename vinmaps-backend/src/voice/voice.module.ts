import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { MulterModule } from '@nestjs/platform-express';
import { TelemetryModule } from '../modules/telemetry/telemetry.module';
@Module({
  imports: [MulterModule.register({ dest: './tmp' }), TelemetryModule],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [],
})
export class VoiceModule {}
