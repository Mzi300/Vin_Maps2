import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('model_evaluation_logs')
export class ModelEvaluationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  routeId: string;

  @Column({ type: 'float' })
  predictedEta: number;

  @Column({ type: 'float', nullable: true })
  actualEta?: number;

  @Column({ type: 'jsonb', nullable: true })
  congestionPrediction: any;

  @Column({ type: 'jsonb', nullable: true })
  anomalyFlags: any;

  @Column({ type: 'float' })
  finalScore: number;

  @CreateDateColumn()
  timestamp: Date;
}
