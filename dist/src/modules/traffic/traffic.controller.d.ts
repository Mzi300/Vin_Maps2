import { TrafficService } from './traffic.service';
import { HistoricalTrafficDto } from './dto/historical-traffic.dto';
export declare class TrafficController {
    private readonly trafficService;
    constructor(trafficService: TrafficService);
    getHistorical(query: HistoricalTrafficDto): Promise<any>;
}
