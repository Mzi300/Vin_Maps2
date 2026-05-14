import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('traffic_lights')
export class TrafficLight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: any;

  @Column({ default: 'unknown' })
  current_state: string; // red, green, yellow, offline

  @Column({ type: 'int', nullable: true })
  time_remaining: number; // Seconds until change

  @UpdateDateColumn()
  updated_at: Date;
}
