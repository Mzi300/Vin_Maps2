import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum IncidentType {
  POTHOLE = 'POTHOLE',
  ACCIDENT = 'ACCIDENT',
  ROAD_HAZARD = 'ROAD_HAZARD',
  ROAD_CLOSURE = 'ROAD_CLOSURE',
  FLOOD = 'FLOOD',
  BROKEN_TRAFFIC_LIGHT = 'BROKEN_TRAFFIC_LIGHT',
  POLICE_CHECKPOINT = 'POLICE_CHECKPOINT',
  CONSTRUCTION = 'CONSTRUCTION',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}
