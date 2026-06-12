import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteUsageLog } from './route-usage-log.entity';
import { WeightUpdaterService } from '../reinforcement/weight-updater.service';
import { EtaModelService } from '../models/eta-model.service';

export class TripCompletionPayload {
  routeId: string;
  userId?: string;
  startTime: Date;
  endTime: Date;
  distanceKm: number;
  predictedEtaMinutes: number;
  predictedSafetyScore: number;
  actualEvents: any[];
  congestionLevel: number;
  routeScoreInputs: any;
}

@Injectable()
export class OutcomeTrackerService {
  private readonly logger = new Logger(OutcomeTrackerService.name);

  constructor(
    @InjectRepository(RouteUsageLog)
    private readonly routeUsageLogRepo: Repository<RouteUsageLog>,
    private readonly weightUpdater: WeightUpdaterService,
    private readonly etaModel: EtaModelService,
  ) {}

  async finalizeTrip(payload: TripCompletionPayload): Promise<RouteUsageLog> {
    const actualEtaMinutes = Math.max(1, Math.round((new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000));
    const etaError = actualEtaMinutes - payload.predictedEtaMinutes;
    const safetyPenalty = payload.predictedSafetyScore < 85 ? 10 : 0;

    // Apply RL Bandit Learning Hook
    this.weightUpdater.applyReward(etaError, safetyPenalty, 0);
    this.etaModel.updateBias(etaError);

    const log = this.routeUsageLogRepo.create({
      ...payload,
      actualEtaMinutes,
      ruleBasedScore: payload.routeScoreInputs?.ruleBasedScore || payload.predictedSafetyScore,
      mlAdjustmentScore: payload.routeScoreInputs?.mlScore || 0,
    });

    await this.routeUsageLogRepo.save(log);
    
    this.logger.log(`Trip finalized [${payload.routeId}]. Actual ETA: ${actualEtaMinutes}m (Error: ${etaError > 0 ? '+' : ''}${etaError}m). Ground truth saved.`);

    return log;
  }
}
