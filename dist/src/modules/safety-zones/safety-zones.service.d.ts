import { Repository } from 'typeorm';
import { SafetyZone } from './entities/safety-zone.entity';
import { GeoService } from '../geo/geo.service';
export declare class SafetyZonesService {
    private readonly safetyZoneRepository;
    private readonly geoService;
    constructor(safetyZoneRepository: Repository<SafetyZone>, geoService: GeoService);
    findZonesNearPoint(lat: number, lng: number, radiusMeters: number): Promise<SafetyZone[]>;
    isZoneActive(zone: SafetyZone): boolean;
}
