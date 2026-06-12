import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { GeoService } from '../geo/geo.service';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly geoService: GeoService,
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  async createIncident(reporterId: string, dto: CreateIncidentDto) {
    const point = this.geoService.createPoint(dto.latitude, dto.longitude);

    const incident = this.incidentRepository.create({
      reporterId,
      type: dto.type,
      severity: dto.severity,
      location: point,
      description: dto.description,
      mediaUrl: dto.mediaUrl,
    });

    const savedIncident = await this.incidentRepository.save(incident);

    // Broadcast event
    this.telemetryGateway.server.emit('incident_created', {
      type: savedIncident.type,
      severity: savedIncident.severity,
      lat: dto.latitude,
      lng: dto.longitude,
      timestamp: savedIncident.createdAt,
    });

    return savedIncident;
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    const origin = this.geoService.createPoint(lat, lng);
    // ST_DWithin uses meters for geography types
    const radiusMeters = radiusKm * 1000;

    return this.incidentRepository
      .createQueryBuilder('incident')
      .where('ST_DWithin(incident.location, ST_GeomFromEWKT(:origin), :distance)', {
        origin,
        distance: radiusMeters,
      })
      .andWhere('incident.status IN (:...statuses)', { statuses: ['PENDING', 'VERIFIED'] })
      .getMany();
  }
}
