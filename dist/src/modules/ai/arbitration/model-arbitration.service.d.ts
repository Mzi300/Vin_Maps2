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
export declare class ModelArbitrationService {
    private readonly logger;
    arbitrate(input: ArbitrationInput): ArbitrationOutput;
}
