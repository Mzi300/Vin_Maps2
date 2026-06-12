import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('vehicle_telemetry')
export class VehicleTelemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string;

  @Column('float')
  speed: number;

  @Column('float', { nullable: true })
  heading: number;

  @Column('float', { nullable: true })
  accuracy: number;

  @Index()
  @CreateDateColumn()
  timestamp: Date;
}
