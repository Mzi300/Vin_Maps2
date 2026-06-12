import { Injectable } from '@nestjs/common';
import { ArbitrationOutput, ArbitrationInput } from '../arbitration/model-arbitration.service';

@Injectable()
export class RouteExplanationService {
  
  generateExplanation(input: ArbitrationInput, output: ArbitrationOutput): string {
    if (input.hasAnomaly) {
      return "Route selected with caution due to active traffic anomaly. Safely capped by arbitration limits.";
    }

    if (input.confidenceScore < 0.5) {
      return "High uncertainty detected; ML models downgraded. Rule-based engine prioritized.";
    }

    if (output.dominantFactor === 'Congestion' && input.congestionLevel !== 'LOW') {
      return `Congestion forecast predicts worsening traffic. Score penalized.`;
    }

    if (output.dominantFactor === 'Temporal') {
      return "Temporal patterns heavily influenced this route (e.g. rush hour optimization).";
    }

    if (output.dominantFactor === 'RL') {
      return "Historical reinforcement learning corrections were the primary driver for this route.";
    }

    if (input.ruleScore > 80) {
      return "Route selected due to stable traffic conditions and high rule-based safety.";
    }

    return "Route generated via balanced multi-model arbitration.";
  }
}
