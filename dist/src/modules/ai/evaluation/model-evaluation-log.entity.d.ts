export declare class ModelEvaluationLog {
    id: string;
    routeId: string;
    predictedEta: number;
    actualEta?: number;
    congestionPrediction: any;
    anomalyFlags: any;
    finalScore: number;
    timestamp: Date;
}
