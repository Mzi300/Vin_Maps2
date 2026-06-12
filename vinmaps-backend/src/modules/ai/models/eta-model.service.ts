import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EtaModelService {
  private readonly logger = new Logger(EtaModelService.name);

  private globalEtaBias = 0.0;

  // correctedETA = baseETA + learnedBias
  calculateLearnedBias(features: any): number {
    let bias = this.globalEtaBias;

    // Simple bias correction learned rules (mocked for v1)
    if (features.timeOfDay >= 16 && features.timeOfDay <= 18 && features.dayOfWeek >= 1 && features.dayOfWeek <= 5) {
      bias += 4;
    }

    if (features.incidentCount > 0) {
      bias += (features.incidentCount * 2);
    }

    return bias;
  }

  updateBias(etaError: number) {
    // Learn from the error (alpha = 0.1)
    this.globalEtaBias += etaError * 0.1;
  }

  getGlobalBias() {
    return this.globalEtaBias;
  }
}
