export declare enum HazardType {
    POTHOLE = "pothole",
    ACCIDENT = "accident",
    FLOODING = "flooding",
    PROTEST = "protest",
    ROADBLOCK = "roadblock",
    HIJACKING_HOTSPOT = "hijacking_hotspot",
    BROKEN_TRAFFIC_LIGHT = "broken_traffic_light",
    HEAVY_CONGESTION = "heavy_congestion",
    POLICE_CHECKPOINT = "police_checkpoint"
}
export declare enum HazardSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
export declare class Hazard {
    id: string;
    type: HazardType;
    severity: HazardSeverity;
    confidence_score: number;
    verified: boolean;
    source: string;
    location: any;
    expires_at: Date;
    upvotes: number;
    downvotes: number;
    created_at: Date;
    updated_at: Date;
}
