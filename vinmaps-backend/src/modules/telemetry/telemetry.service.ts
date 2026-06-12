import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleTelemetry } from './entities/vehicle-telemetry.entity';
import { LocationUpdateDto } from './dto/location-update.dto';
import { GeoService } from '../geo/geo.service';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryClusteringService } from './telemetry-clustering.service';
import { SafetyZonesService } from '../safety-zones/safety-zones.service';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectRepository(VehicleTelemetry)
    private readonly telemetryRepository: Repository<VehicleTelemetry>,
    private readonly geoService: GeoService,
    private readonly telemetryGateway: TelemetryGateway,
    private readonly clusteringService: TelemetryClusteringService,
    private readonly safetyZonesService: SafetyZonesService,
  ) {}

  async processLocationUpdate(userId: string, dto: LocationUpdateDto) {
    const point = this.geoService.createPoint(dto.latitude, dto.longitude);

    const telemetry = this.telemetryRepository.create({
      userId,
      location: point,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
    });

    await this.telemetryRepository.save(telemetry);

    // Track for real-time clustering
    this.clusteringService.trackVehicle(userId, dto.latitude, dto.longitude, dto.speed);

    // Check Safety Zones and trigger real-time warning if applicable
    const nearbyZones = await this.safetyZonesService.findZonesNearPoint(dto.latitude, dto.longitude, 100);
    for (const zone of nearbyZones) {
      if (this.safetyZonesService.isZoneActive(zone)) {
        let msg = 'Safety zone ahead.';
        let speed = 60;
        if (zone.type === 'SCHOOL') { msg = 'School zone ahead. Reduce speed.'; speed = 40; }
        else if (zone.type === 'CRIME') msg = 'High crime risk area.';
        else if (zone.type === 'ENVIRONMENT') msg = 'Environmental hazard zone.';

        this.telemetryGateway.server.emit('safety_zone_alert', {
          zoneType: zone.type,
          riskLevel: zone.riskLevel,
          message: zone.description || msg,
          recommendedSpeed: speed,
          timestamp: new Date(),
        });
        break; // Only send 1 alert per update to avoid spam
      }
    }

    // Broadcast to real-time clients
    this.telemetryGateway.broadcastLocationUpdate({
      userId,
      lat: dto.latitude,
      lng: dto.longitude,
      speed: dto.speed,
      heading: dto.heading,
      timestamp: new Date(),
    });

    return { success: true };
  }
}
