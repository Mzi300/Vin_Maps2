import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CongestionModelService {
  private readonly logger = new Logger(CongestionModelService.name);

  // Simple weighted logistic model: Returns probability (0-1)
  predictCongestionProbability(features: any): number {
    let score = 0;

    // Weights
    score += (features.incidentCount * 0.3);
    score += (features.avgTrafficLevel * 0.4);

    if (features.timeOfDay >= 16 && features.timeOfDay <= 18) {
      score += 0.2;
    }

    // Clamp probability between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }
}
