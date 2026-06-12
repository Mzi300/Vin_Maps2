import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Preference {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: false })
  avoidTolls: boolean;

  @Column({ type: 'int', default: 80 })
  preferredSpeedKmh: number;

  @Column({ type: 'enum', enum: ['car', 'truck', 'motorcycle'], default: 'car' })
  vehicleType: 'car' | 'truck' | 'motorcycle';
}
