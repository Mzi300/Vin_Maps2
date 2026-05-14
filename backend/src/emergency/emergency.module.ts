import { Module } from '@nestjs/common';
import { EmergencyGateway } from './emergency.gateway';

@Module({
  providers: [EmergencyGateway],
  exports: [EmergencyGateway],
})
export class EmergencyModule {}
