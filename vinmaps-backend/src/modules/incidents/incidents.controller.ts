import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createIncident(@Request() req, @Body() createIncidentDto: CreateIncidentDto) {
    const userId = req.user.id;
    return this.incidentsService.createIncident(userId, createIncidentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  async getNearbyIncidents(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
  ) {
    const radiusKm = radius ? parseFloat(radius) : 5;
    return this.incidentsService.findNearby(parseFloat(lat), parseFloat(lng), radiusKm);
  }
}
