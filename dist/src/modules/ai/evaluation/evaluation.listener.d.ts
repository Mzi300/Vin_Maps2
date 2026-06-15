import { Repository } from 'typeorm';
import { ModelEvaluationLog } from './model-evaluation-log.entity';
export declare class EvaluationListener {
    private readonly evaluationLogRepo;
    private readonly logger;
    constructor(evaluationLogRepo: Repository<ModelEvaluationLog>);
    handleRouteEvaluatedEvent(payload: any): Promise<void>;
}
