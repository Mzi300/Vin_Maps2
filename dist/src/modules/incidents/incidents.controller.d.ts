import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
export declare class IncidentsController {
    private readonly incidentsService;
    constructor(incidentsService: IncidentsService);
    createIncident(req: any, createIncidentDto: CreateIncidentDto): Promise<import("./entities/incident.entity").Incident>;
    getNearbyIncidents(lat: string, lng: string, radius: string): Promise<import("./entities/incident.entity").Incident[]>;
}
