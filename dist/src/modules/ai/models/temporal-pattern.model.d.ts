export interface TemporalPatternOutput {
    timeSlot: string;
    expectedTrafficMultiplier: number;
    deviationRiskScore: number;
}
export declare class TemporalPatternModel {
    getPatternForTime(date: Date): Promise<TemporalPatternOutput>;
}
