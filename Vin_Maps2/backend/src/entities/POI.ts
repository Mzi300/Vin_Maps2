import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'pois' })
export class POI {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lon: number;

  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'text', array: true, nullable: true })
  aliases?: string[];

  @Column({ type: 'float', nullable: true })
  rating?: number;

  @Column({ type: 'int', nullable: true })
  reviewCount?: number;

  @Column({ type: 'float', nullable: true })
  popularityScore?: number;

  @Column({ type: 'jsonb', nullable: true })
  openingHours?: any; // could be structured JSON

  @Column({ type: 'jsonb', nullable: true })
  contactInfo?: any;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;

  @Column({ type: 'text', nullable: true })
  source?: string;

  // Index for fast geospatial queries (PostGIS will use a geometry column, but we keep simple lat/lon for now)
  @Index({ spatial: true })
  @Column({ type: 'geometry', nullable: true, spatialFeatureType: 'Point', srid: 4326 })
  geom?: any;
}
