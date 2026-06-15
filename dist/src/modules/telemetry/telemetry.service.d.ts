import { Repository } from 'typeorm';
import { VehicleTelemetry } from './entities/vehicle-telemetry.entity';
import { LocationUpdateDto } from './dto/location-update.dto';
import { GeoService } from '../geo/geo.service';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryClusteringService } from './telemetry-clustering.service';
import { SafetyZonesService } from '../safety-zones/safety-zones.service';
export declare class TelemetryService {
    private readonly telemetryRepository;
    private readonly geoService;
    private readonly telemetryGateway;
    private readonly clusteringService;
    private readonly safetyZonesService;
    constructor(telemetryRepository: Repository<VehicleTelemetry>, geoService: GeoService, telemetryGateway: TelemetryGateway, clusteringService: TelemetryClusteringService, safetyZonesService: SafetyZonesService);
    processLocationUpdate(userId: string, dto: LocationUpdateDto): Promise<{
        success: boolean;
    }>;
}
