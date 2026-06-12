import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('safety_zones')
export class SafetyZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['SCHOOL', 'CRIME', 'ENVIRONMENT'],
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  riskLevel: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  boundary: any;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  activeHours: string;

  @CreateDateColumn()
  createdAt: Date;
}
