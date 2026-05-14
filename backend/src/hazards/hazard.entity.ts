import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum HazardType {
  POTHOLE = 'pothole',
  ACCIDENT = 'accident',
  FLOODING = 'flooding',
  PROTEST = 'protest',
  ROADBLOCK = 'roadblock',
  HIJACKING_HOTSPOT = 'hijacking_hotspot',
  BROKEN_TRAFFIC_LIGHT = 'broken_traffic_light',
  HEAVY_CONGESTION = 'heavy_congestion',
  POLICE_CHECKPOINT = 'police_checkpoint',
}

export enum HazardSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('hazards')
export class Hazard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: HazardType,
  })
  type: HazardType;

  @Column({
    type: 'enum',
    enum: HazardSeverity,
    default: HazardSeverity.INFO,
  })
  severity: HazardSeverity;

  @Column('float', { default: 0 })
  confidence_score: number;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  source: string;

  // Geospatial Point: [lng, lat]
  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: any;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
