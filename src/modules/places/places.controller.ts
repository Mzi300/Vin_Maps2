import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { Place } from './entities/place.entity';

@UseGuards(JwtAuthGuard)
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  async findAll(@Request() req): Promise<Place[]> {
    const userId = req.user.id;
    return this.placesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string): Promise<Place> {
    const userId = req.user.id;
    return this.placesService.findOne(userId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreatePlaceDto): Promise<Place> {
    const userId = req.user.id;
    return this.placesService.create(userId, dto);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePlaceDto): Promise<Place> {
    const userId = req.user.id;
    return this.placesService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    return this.placesService.remove(userId, id);
  }
}
