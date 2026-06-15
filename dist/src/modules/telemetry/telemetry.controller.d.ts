import { TelemetryService } from './telemetry.service';
import { LocationUpdateDto } from './dto/location-update.dto';
export declare class TelemetryController {
    private readonly telemetryService;
    constructor(telemetryService: TelemetryService);
    updateLocation(req: any, locationUpdateDto: LocationUpdateDto): Promise<{
        success: boolean;
    }>;
}
