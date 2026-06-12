import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  reporterId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: [
      'POTHOLE',
      'ACCIDENT',
      'ROAD_HAZARD',
      'ROAD_CLOSURE',
      'FLOOD',
      'BROKEN_TRAFFIC_LIGHT',
      'POLICE_CHECKPOINT',
      'CONSTRUCTION',
    ],
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  })
  severity: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED'],
    default: 'PENDING',
  })
  status: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ default: 0 })
  verificationScore: number;

  @Column({ default: 0 })
  reportCount: number;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
