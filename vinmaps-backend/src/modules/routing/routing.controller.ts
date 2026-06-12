import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { RouteIntelligenceService } from './route-intelligence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OutcomeTrackerService, TripCompletionPayload } from '../ai/learning/outcome-tracker.service';

@Controller('routing')
export class RoutingController {
  constructor(
    private readonly routeIntelligenceService: RouteIntelligenceService,
    private readonly outcomeTrackerService: OutcomeTrackerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('smart')
  async getSmartRoutes(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const [startLat, startLng] = start.split(',').map(Number);
    const [endLat, endLng] = end.split(',').map(Number);
    return this.routeIntelligenceService.calculateSmartRoutes(startLat, startLng, endLat, endLng);
  }

  @Post('complete-trip')
  async completeTrip(@Body() payload: any) {
    const normalizedPayload = {
      ...payload,
      startTime: new Date(payload.startTime),
      endTime: new Date(payload.endTime),
    };
    return this.outcomeTrackerService.finalizeTrip(normalizedPayload);
  }
}
