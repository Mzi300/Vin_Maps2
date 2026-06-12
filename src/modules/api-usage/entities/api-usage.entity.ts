import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('api_usage')
export class ApiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiName: string; // e.g., 'TomTom'

  @Column()
  endpoint: string; // endpoint name or path

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  date: Date;

  @Column({ type: 'int', default: 1 })
  count: number;
}
