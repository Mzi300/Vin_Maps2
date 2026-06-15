export interface CongestionForecastOutput {
    clusterId?: string;
    congestionProbability: number;
    predictedLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timeHorizon: '5m' | '15m' | '30m';
}
export declare class CongestionForecastModel {
    private readonly logger;
    predictFutureCongestion(clusterId: string, currentDensity: number, historicalTrend: number, rlWeight: number): Promise<CongestionForecastOutput>;
}
