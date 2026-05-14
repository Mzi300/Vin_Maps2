import { Repository } from 'typeorm';
import { DriverSession } from './driver-session.entity';
export declare class FleetService {
    private sessionRepository;
    constructor(sessionRepository: Repository<DriverSession>);
    getOrCreateSession(operatorId: string): Promise<DriverSession>;
    recordEvent(operatorId: string, type: string): Promise<DriverSession>;
}
