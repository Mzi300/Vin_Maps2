import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafetyZone } from './entities/safety-zone.entity';
import { GeoService } from '../geo/geo.service';

@Injectable()
export class SafetyZonesService {
  constructor(
    @InjectRepository(SafetyZone)
    private readonly safetyZoneRepository: Repository<SafetyZone>,
    private readonly geoService: GeoService,
  ) {}

  async findZonesNearPoint(lat: number, lng: number, radiusMeters: number): Promise<SafetyZone[]> {
    const point = this.geoService.createPoint(lat, lng);
    
    return this.safetyZoneRepository
      .createQueryBuilder('zone')
      .where('ST_DWithin(zone.boundary::geography, ST_SetSRID(ST_GeomFromGeoJSON(:point), 4326)::geography, :distance)', {
        point: JSON.stringify(point),
        distance: radiusMeters,
      })
      .getMany();
  }

  isZoneActive(zone: SafetyZone): boolean {
    if (zone.type !== 'SCHOOL' || !zone.activeHours) {
      return true;
    }

    const now = new Date();
    const [startStr, endStr] = zone.activeHours.split('-');
    if (!startStr || !endStr) return true;

    const currentTotalMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startStr.split(':').map(Number);
    const startTotal = startH * 60 + startM;

    const [endH, endM] = endStr.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    return currentTotalMins >= startTotal && currentTotalMins <= endTotal;
  }
}
