import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WeightUpdaterService {
  private readonly logger = new Logger(WeightUpdaterService.name);

  // Bandit-style dynamic weight modifier
  // Bounded between [-0.2, +0.2] (-20% to +20%)
  
  private currentWeightBias = 0.0;
  private lastErrors: number[] = [];
  private totalUpdates = 0;

  getLearnedWeightModifier(): number {
    return this.currentWeightBias;
  }

  // Called when a trip finishes to update the global or area-specific weight
  applyReward(etaError: number, safetyPenalty: number, rerouteFrequency: number) {
    this.totalUpdates++;
    this.lastErrors.push(etaError);
    if (this.lastErrors.length > 20) this.lastErrors.shift();

    let reward = 0;
    const absError = Math.abs(etaError);

    if (absError <= 2 && safetyPenalty === 0 && rerouteFrequency === 0) {
      reward = 0.5; // Positive reinforcement for stability
    } else {
      reward = -(absError * 0.1 + safetyPenalty + rerouteFrequency);
    }
    
    // Very simple bandit update rule (Learning Rate alpha = 0.01)
    const alpha = 0.01;
    this.currentWeightBias += (reward * alpha);

    // Decay towards 0 slightly to prevent long-term saturation drift
    this.currentWeightBias *= 0.99;

    // Enforce bounds [-0.2, 0.2]
    if (this.currentWeightBias > 0.2) this.currentWeightBias = 0.2;
    if (this.currentWeightBias < -0.2) this.currentWeightBias = -0.2;

    this.logger.debug(`Reinforcement Weight updated. New Bias: ${this.currentWeightBias.toFixed(3)}`);
  }

  getModelState() {
    return {
      currentWeightBias: this.currentWeightBias,
      totalUpdates: this.totalUpdates,
      last20EtaErrors: this.lastErrors,
      averageRecentError: this.lastErrors.length > 0 ? this.lastErrors.reduce((a, b) => a + Math.abs(b), 0) / this.lastErrors.length : 0,
      stability: (this.currentWeightBias >= 0.2 || this.currentWeightBias <= -0.2) ? 'SATURATED' : 'STABLE'
    };
  }
}
