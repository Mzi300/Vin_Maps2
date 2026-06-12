import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  linkUrl: string;

  @Column('timestamp')
  @Index()
  startDate: Date;

  @Column('timestamp')
  @Index()
  endDate: Date;

  // Optional target route to show promotion only for specific routes (e.g., "origin-destination")
  @Column({ nullable: true })
  targetRoute: string;

  // Optional budget field for future billing integration
  @Column({ type: 'float', nullable: true })
  budget: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
