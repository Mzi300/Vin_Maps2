import { Injectable, Logger } from '@nestjs/common';

export interface ArbitrationInput {
  ruleScore: number;
  mlScore: number;
  rlBias: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  temporalRiskScore: number;
  hasAnomaly: boolean;
  confidenceScore: number;
}

export interface ArbitrationOutput {
  finalScore: number;
  weights: Record<string, number>;
  dominantFactor: string;
}

@Injectable()
export class ModelArbitrationService {
  private readonly logger = new Logger(ModelArbitrationService.name);

  arbitrate(input: ArbitrationInput): ArbitrationOutput {
    // Step 1: Normalize all inputs into a common 0-1 penalty/bonus scale
    
    // ruleScore is 0-100. We want to convert to a raw "score addition" where baseline is 100
    // so ruleScore 90 means we keep 90. We'll map ruleScore to its direct value.
    const normalizedRule = Math.max(0, Math.min(100, input.ruleScore));
    
    // rlBias is between -0.2 and +0.2
    // Let's normalize it so it can shift score by up to 20 points
    const normalizedRl = input.rlBias * 100; 

    // congestion Level
    let congestionPenalty = 0;
    if (input.congestionLevel === 'CRITICAL') congestionPenalty = -20;
    else if (input.congestionLevel === 'HIGH') congestionPenalty = -10;
    else if (input.congestionLevel === 'MEDIUM') congestionPenalty = -5;

    // Temporal Risk
    const temporalPenalty = -(input.temporalRiskScore * 0.5); // max 20 -> -10

    // Anomaly Penalty
    const anomalyPenalty = input.hasAnomaly ? -30 : 0; // High impact

    // ML Base Score
    const normalizedMl = Math.max(-20, Math.min(20, input.mlScore));

    // Step 2: Dynamic Weighting Based on Confidence
    // If confidence is low, we decrease ML/RL weights and rely heavily on Rule base.
    const c = input.confidenceScore; // 0 to 1
    
    let wRule = 0.5 + ((1 - c) * 0.5); // 0.5 to 1.0 (Low conf -> High rule weight)
    let wRl = 0.2 * c;
    let wMl = 0.2 * c;
    let wCongestion = 0.3 * c;
    let wTemporal = 0.2 * c;
    let wAnomaly = 0.5; // Anomaly always has high weight regardless of ML confidence

    // Step 3: Enforce 60% Influence Cap on weights
    // To do this, we normalize the weights to sum to 1.0
    let totalWeight = wRule + Math.abs(wRl) + Math.abs(wMl) + wCongestion + wTemporal + wAnomaly;
    
    wRule /= totalWeight;
    wRl /= totalWeight;
    wMl /= totalWeight;
    wCongestion /= totalWeight;
    wTemporal /= totalWeight;
    wAnomaly /= totalWeight;

    // Apply cap
    wRule = Math.min(wRule, 0.6);
    wRl = Math.min(wRl, 0.6);
    wMl = Math.min(wMl, 0.6);
    wCongestion = Math.min(wCongestion, 0.6);
    wTemporal = Math.min(wTemporal, 0.6);
    wAnomaly = Math.min(wAnomaly, 0.6); // Safely capped

    // Step 4: Compute final score
    let finalScore = 
      (normalizedRule * wRule) + 
      (normalizedRule + normalizedRl) * wRl + 
      (normalizedRule + normalizedMl) * wMl + 
      (normalizedRule + congestionPenalty) * wCongestion + 
      (normalizedRule + temporalPenalty) * wTemporal + 
      (normalizedRule + anomalyPenalty) * wAnomaly;

    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;

    // Identify dominant factor
    const impacts = {
      RuleBase: wRule,
      RL: wRl,
      ML: wMl,
      Congestion: wCongestion,
      Temporal: wTemporal,
      Anomaly: wAnomaly
    };
    
    const dominantFactor = Object.keys(impacts).reduce((a, b) => impacts[a as keyof typeof impacts] > impacts[b as keyof typeof impacts] ? a : b);

    return {
      finalScore: parseFloat(finalScore.toFixed(2)),
      weights: {
        RuleBase: parseFloat(wRule.toFixed(2)),
        RL: parseFloat(wRl.toFixed(2)),
        ML: parseFloat(wMl.toFixed(2)),
        Congestion: parseFloat(wCongestion.toFixed(2)),
        Temporal: parseFloat(wTemporal.toFixed(2)),
        Anomaly: parseFloat(wAnomaly.toFixed(2))
      },
      dominantFactor
    };
  }
}
