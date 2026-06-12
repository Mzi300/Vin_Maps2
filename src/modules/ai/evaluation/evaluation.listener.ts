import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelEvaluationLog } from './model-evaluation-log.entity';

@Injectable()
export class EvaluationListener {
  private readonly logger = new Logger(EvaluationListener.name);

  constructor(
    @InjectRepository(ModelEvaluationLog)
    private readonly evaluationLogRepo: Repository<ModelEvaluationLog>
  ) {}

  @OnEvent('route.evaluated', { async: true })
  async handleRouteEvaluatedEvent(payload: any) {
    try {
      const log = this.evaluationLogRepo.create({
        routeId: payload.routeId,
        predictedEta: payload.predictedEta,
        congestionPrediction: payload.congestionPrediction,
        anomalyFlags: payload.anomalyFlags,
        finalScore: payload.finalScore,
      });
      await this.evaluationLogRepo.save(log);
      this.logger.debug(`Async evaluation log saved for route ${payload.routeId}`);
    } catch (e: any) {
      this.logger.error(`Failed to save ModelEvaluationLog: ${e.message}`);
    }
  }
}
