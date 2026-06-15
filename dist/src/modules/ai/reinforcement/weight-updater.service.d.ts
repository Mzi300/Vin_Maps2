export declare class WeightUpdaterService {
    private readonly logger;
    private currentWeightBias;
    private lastErrors;
    private totalUpdates;
    getLearnedWeightModifier(): number;
    applyReward(etaError: number, safetyPenalty: number, rerouteFrequency: number): void;
    getModelState(): {
        currentWeightBias: number;
        totalUpdates: number;
        last20EtaErrors: number[];
        averageRecentError: number;
        stability: string;
    };
}
