import { Controller, Get, Query } from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { HistoricalTrafficDto } from './dto/historical-traffic.dto';

@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Get('historical')
  async getHistorical(@Query() query: HistoricalTrafficDto) {
    // Delegates to service; returns mock data for now
    return this.trafficService.getHistoricalTraffic(query);
  }
}
