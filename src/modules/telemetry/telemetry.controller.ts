import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { LocationUpdateDto } from './dto/location-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @UseGuards(JwtAuthGuard)
  @Post('location-update')
  async updateLocation(@Request() req, @Body() locationUpdateDto: LocationUpdateDto) {
    const userId = req.user.id;
    return this.telemetryService.processLocationUpdate(userId, locationUpdateDto);
  }
}
