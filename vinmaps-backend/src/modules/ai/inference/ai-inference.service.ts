import { Injectable, Logger } from '@nestjs/common';

export interface RawTripData {
  distanceKm: number;
  avgTrafficLevel: number;
  incidentCount: number;
  safetyZoneExposure: number;
  startTime: Date;
}

@Injectable()
export class AIInferenceService {
  private readonly logger = new Logger(AIInferenceService.name);

  constructor() {}

  public calculateMLAdjustment(tripData: RawTripData): number {
    let mlAdjustment = 0;
    const hours = tripData.startTime?.getHours() || 12;
    const dayOfWeek = tripData.startTime?.getDay() || 1;

    const isRushHour = (hours >= 7 && hours <= 9) || 
                       (hours >= 16 && hours <= 18);
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (isWeekday && isRushHour) {
      mlAdjustment -= 5; 
      this.logger.debug('AI Model applied temporal rush hour penalty.');
    }
    if (tripData.incidentCount > 1) {
      mlAdjustment -= (tripData.incidentCount * 2);
    }
    if (tripData.distanceKm > 10 && tripData.avgTrafficLevel < 1) {
      mlAdjustment += 3;
    }

    return mlAdjustment;
  }
}
