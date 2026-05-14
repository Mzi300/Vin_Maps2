import { FleetService } from './fleet.service';
export declare class FleetController {
    private readonly fleetService;
    constructor(fleetService: FleetService);
    getSession(operatorId: string): Promise<import("./driver-session.entity").DriverSession>;
    getGlobalSafetyIndex(): Promise<{
        global_index: number;
        active_units: number;
        last_update: Date;
    }>;
}
