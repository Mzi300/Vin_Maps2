import { Repository } from 'typeorm';
import { RouteUsageLog } from './route-usage-log.entity';
import { WeightUpdaterService } from '../reinforcement/weight-updater.service';
import { EtaModelService } from '../models/eta-model.service';
export declare class TripCompletionPayload {
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
export declare class OutcomeTrackerService {
    private readonly routeUsageLogRepo;
    private readonly weightUpdater;
    private readonly etaModel;
    private readonly logger;
    constructor(routeUsageLogRepo: Repository<RouteUsageLog>, weightUpdater: WeightUpdaterService, etaModel: EtaModelService);
    finalizeTrip(payload: TripCompletionPayload): Promise<RouteUsageLog>;
}
