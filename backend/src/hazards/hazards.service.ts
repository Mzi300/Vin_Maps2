import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hazard } from './hazard.entity';

@Injectable()
export class HazardsService {
  constructor(
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
  ) {}

  async report(data: Partial<Hazard>): Promise<Hazard> {
    const { type, location } = data;
    if (!location || !location.coordinates) return this.create(data);
    
    const [lng, lat] = location.coordinates;

    // 1. Search for existing similar hazards within a 20m radius
    const existing = await this.hazardsRepository
      .createQueryBuilder('hazard')
      .where('hazard.type = :type', { type })
      .andWhere(
        'ST_DWithin(hazard.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)',
        { lng, lat, radius: 20 / 111320 }
      )
      .getOne();

    if (existing) {
      // 2. Conflict Resolution: Update existing rather than create duplicate
      existing.upvotes += 1;
      existing.confidence_score = Math.min(100, existing.confidence_score + 5);
      console.log(`[Conflict Resolution] Merging report into existing hazard: ${existing.id}`);
      return this.hazardsRepository.save(existing);
    }

    // 3. Fresh report
    return this.create(data);
  }

  async create(data: Partial<Hazard>): Promise<Hazard> {
    const hazard = this.hazardsRepository.create(data);
    return this.hazardsRepository.save(hazard);
  }

  async findAll(): Promise<Hazard[]> {
    return this.hazardsRepository.find();
  }

  async findNearby(lng: number, lat: number, radiusMeters: number = 5000) {
    return this.hazardsRepository
      .createQueryBuilder('hazard')
      .where(
        'ST_DWithin(hazard.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :radius)',
        { lng, lat, radius: radiusMeters / 111320 }
      )
      .getMany();
  }
}
