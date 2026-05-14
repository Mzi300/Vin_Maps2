import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('driver_sessions')
export class DriverSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  operator_id: string;

  @Column('float', { default: 100 })
  safety_score: number;

  @Column({ default: 0 })
  hard_braking_events: number;

  @Column({ default: 0 })
  potholes_detected: number;

  @Column('float', { default: 0 })
  total_distance: number;

  @CreateDateColumn()
  started_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
