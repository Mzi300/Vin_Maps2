import { Injectable } from '@nestjs/common';

export interface TemporalPatternOutput {
  timeSlot: string;
  expectedTrafficMultiplier: number;
  deviationRiskScore: number;
}

@Injectable()
export class TemporalPatternModel {
  
  async getPatternForTime(date: Date): Promise<TemporalPatternOutput> {
    const hours = date.getHours();
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;

    let multiplier = 1.0;
    let riskScore = 0;
    let slot = 'NORMAL';

    if (!isWeekend) {
      if (hours >= 7 && hours <= 9) {
        slot = 'MORNING_RUSH';
        multiplier = 1.4;
        riskScore = 15;
      } else if (hours >= 16 && hours <= 18) {
        slot = 'EVENING_RUSH';
        multiplier = 1.5;
        riskScore = 20;
      }
    } else {
      if (hours >= 12 && hours <= 15) {
        slot = 'WEEKEND_MIDDAY';
        multiplier = 1.2;
        riskScore = 5;
      }
    }

    return {
      timeSlot: slot,
      expectedTrafficMultiplier: multiplier,
      deviationRiskScore: riskScore
    };
  }
}
