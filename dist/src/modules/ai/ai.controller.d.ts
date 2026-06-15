import { WeightUpdaterService } from './reinforcement/weight-updater.service';
import { EtaModelService } from './models/eta-model.service';
export declare class AiController {
    private readonly weightUpdater;
    private readonly etaModel;
    constructor(weightUpdater: WeightUpdaterService, etaModel: EtaModelService);
    getModelState(): {
        rl: {
            currentWeightBias: number;
            totalUpdates: number;
            last20EtaErrors: number[];
            averageRecentError: number;
            stability: string;
        };
        etaGlobalBias: number;
    };
}
