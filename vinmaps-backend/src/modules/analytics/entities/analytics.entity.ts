import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('analytics')
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Index()
  @Column()
  endpoint: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  destination: string;

  @Column({ type: 'int', nullable: true })
  responseTimeMs: number;

  @Column({ nullable: true })
  status: number;
}
