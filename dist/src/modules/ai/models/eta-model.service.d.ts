export declare class EtaModelService {
    private readonly logger;
    private globalEtaBias;
    calculateLearnedBias(features: any): number;
    updateBias(etaError: number): void;
    getGlobalBias(): number;
}
