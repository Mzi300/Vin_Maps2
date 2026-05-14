import { Controller, Get, Param } from '@nestjs/common';
import { FleetService } from './fleet.service';

@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('session/:operatorId')
  async getSession(@Param('operatorId') operatorId: string) {
    return this.fleetService.getOrCreateSession(operatorId);
  }

  @Get('safety-index')
  async getGlobalSafetyIndex() {
    // Future: Aggregate all driver data to provide a city-wide safety score
    return {
      global_index: 88,
      active_units: 12,
      last_update: new Date()
    };
  }
}
