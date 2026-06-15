import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class AnomalyDetectorService {
    private eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    detectAnomaly(densityChange: number, speedDrop: number, activeIncidents: number): Promise<boolean>;
}
