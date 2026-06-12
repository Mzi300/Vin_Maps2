import { Injectable } from '@nestjs/common';

export interface RouteConfidenceOutput {
  routeId: string;
  confidenceScore: number;
  uncertaintyFactors: string[];
}

@Injectable()
export class RouteConfidenceService {
  
  async calculateConfidence(
    routeId: string, 
    ruleScore: number, 
    mlScore: number, 
    hasAnomaly: boolean,
    temporalRisk: number
  ): Promise<RouteConfidenceOutput> {
    
    let confidence = 1.0;
    const factors: string[] = [];

    // Model disagreement: Rule says good, ML says bad
    if (ruleScore > 80 && mlScore < -10) {
      confidence -= 0.2;
      factors.push('MODEL_DISAGREEMENT');
    }

    if (hasAnomaly) {
      confidence -= 0.4;
      factors.push('ACTIVE_ANOMALY');
    }

    if (temporalRisk > 10) {
      confidence -= (temporalRisk / 100);
      factors.push('HIGH_TEMPORAL_VOLATILITY');
    }

    if (confidence < 0) confidence = 0.1;

    return {
      routeId,
      confidenceScore: parseFloat(confidence.toFixed(2)),
      uncertaintyFactors: factors
    };
  }
}
