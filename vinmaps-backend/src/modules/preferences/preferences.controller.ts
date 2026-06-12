import { Controller, Get, Post, Patch, Body, Req } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreatePreferenceDto) {
    // Assuming authentication guard adds user.id
    return this.service.create(req.user.id, dto);
  }

  @Get()
  get(@Req() req) {
    return this.service.findOne(req.user.id);
  }

  @Patch()
  update(@Req() req, @Body() dto: UpdatePreferenceDto) {
    return this.service.update(req.user.id, dto);
  }
}
