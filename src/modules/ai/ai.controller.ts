import { Controller, Get } from '@nestjs/common';
import { WeightUpdaterService } from './reinforcement/weight-updater.service';
import { EtaModelService } from './models/eta-model.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly weightUpdater: WeightUpdaterService,
    private readonly etaModel: EtaModelService
  ) {}

  @Get('debug/model-state')
  getModelState() {
    return {
      rl: this.weightUpdater.getModelState(),
      etaGlobalBias: this.etaModel.getGlobalBias()
    };
  }
}
