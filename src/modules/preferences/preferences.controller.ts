import { Controller, Get, Post, Patch, Body, Req } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@ApiTags('preferences')
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

  @Post()
@ApiCreatedResponse({ description: 'Preference created', type: CreatePreferenceDto })
  create(@Req() req, @Body() dto: CreatePreferenceDto) {
    // Assuming authentication guard adds user.id
    return this.service.create(req.user.id, dto);
  }

  @Get()
@ApiOkResponse({ description: 'Current preferences', type: CreatePreferenceDto })
  get(@Req() req) {
    return this.service.findOne(req.user.id);
  }

  @Patch()
@ApiOkResponse({ description: 'Preference updated', type: UpdatePreferenceDto })
  update(@Req() req, @Body() dto: UpdatePreferenceDto) {
    return this.service.update(req.user.id, dto);
  }
}
