import { Controller, Post, Body } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Post('score-route')
  async scoreRoute(@Body() body: { coordinates: [number, number][] }) {
    return this.intelligenceService.scoreRoute(body.coordinates);
  }
}
