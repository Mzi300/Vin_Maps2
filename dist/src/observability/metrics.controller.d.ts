import { Response } from 'express';
export declare class MetricsController {
    private exporter;
    constructor();
    getMetrics(res: Response): Promise<void>;
}
