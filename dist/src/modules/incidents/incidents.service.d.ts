import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { GeoService } from '../geo/geo.service';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';
export declare class IncidentsService {
    private readonly incidentRepository;
    private readonly geoService;
    private readonly telemetryGateway;
    constructor(incidentRepository: Repository<Incident>, geoService: GeoService, telemetryGateway: TelemetryGateway);
    createIncident(reporterId: string, dto: CreateIncidentDto): Promise<Incident>;
    findNearby(lat: number, lng: number, radiusKm: number): Promise<Incident[]>;
}
