import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HazardsService } from './hazards.service';
export declare class HazardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly hazardsService;
    server: Server;
    constructor(hazardsService: HazardsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleHazardReport(data: any): Promise<import("./hazard.entity").Hazard>;
}
