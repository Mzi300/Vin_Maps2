import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('route_usage_logs')
export class RouteUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid', { nullable: true })
  userId: string;

  @Index()
  @Column('uuid')
  routeId: string;

  @Column('timestamp', { nullable: true })
  startTime: Date;

  @Column('timestamp', { nullable: true })
  endTime: Date;

  @Column('float')
  distanceKm: number;

  @Column('int')
  predictedEtaMinutes: number;

  @Column('int', { nullable: true })
  actualEtaMinutes: number;

  @Column('float', { nullable: true }) // Changed to nullable to be safe on existing records if any
  ruleBasedScore: number;

  @Column('float', { nullable: true })
  mlAdjustmentScore: number;

  @Column('float', { nullable: true })
  efficiencyScore: number;

  @Column('float', { nullable: true })
  predictedSafetyScore: number;

  @Column('jsonb', { nullable: true })
  features: any;

  @Column('jsonb', { nullable: true })
  actualEvents: any;

  @Column('int', { nullable: true })
  congestionLevel: number;

  @Column('jsonb', { nullable: true })
  routeScoreInputs: any;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
