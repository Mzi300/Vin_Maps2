import { Repository } from 'typeorm';
import { Hazard } from './hazard.entity';
export declare class HazardsService {
    private hazardsRepository;
    constructor(hazardsRepository: Repository<Hazard>);
    report(data: Partial<Hazard>): Promise<Hazard>;
    create(data: Partial<Hazard>): Promise<Hazard>;
    findAll(): Promise<Hazard[]>;
    findNearby(lng: number, lat: number, radiusMeters?: number): Promise<Hazard[]>;
}
