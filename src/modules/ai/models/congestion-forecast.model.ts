import { Injectable, Logger } from '@nestjs/common';

export interface CongestionForecastOutput {
  clusterId?: string;
  congestionProbability: number;
  predictedLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeHorizon: '5m' | '15m' | '30m';
}

@Injectable()
export class CongestionForecastModel {
  private readonly logger = new Logger(CongestionForecastModel.name);

  async predictFutureCongestion(clusterId: string, currentDensity: number, historicalTrend: number, rlWeight: number): Promise<CongestionForecastOutput> {
    let probability = (currentDensity / 100) + (historicalTrend * 0.05) + rlWeight;
    if (probability < 0) probability = 0;
    if (probability > 1) probability = 1;

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (probability > 0.8) level = 'CRITICAL';
    else if (probability > 0.6) level = 'HIGH';
    else if (probability > 0.4) level = 'MEDIUM';

    return {
      clusterId,
      congestionProbability: parseFloat(probability.toFixed(2)),
      predictedLevel: level,
      timeHorizon: '15m' 
    };
  }
}
