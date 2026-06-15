export declare enum IncidentType {
    POTHOLE = "POTHOLE",
    ACCIDENT = "ACCIDENT",
    ROAD_HAZARD = "ROAD_HAZARD",
    ROAD_CLOSURE = "ROAD_CLOSURE",
    FLOOD = "FLOOD",
    BROKEN_TRAFFIC_LIGHT = "BROKEN_TRAFFIC_LIGHT",
    POLICE_CHECKPOINT = "POLICE_CHECKPOINT",
    CONSTRUCTION = "CONSTRUCTION"
}
export declare enum IncidentSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare class CreateIncidentDto {
    type: IncidentType;
    severity: IncidentSeverity;
    latitude: number;
    longitude: number;
    description?: string;
    mediaUrl?: string;
}
