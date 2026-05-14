import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  OnGatewayConnection,
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HazardsService } from './hazards.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class HazardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly hazardsService: HazardsService) {}

  handleConnection(client: Socket) {
    console.log(`[Tactical Link] Operator Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Tactical Link] Operator Offline: ${client.id}`);
  }

  @SubscribeMessage('report-hazard')
  async handleHazardReport(@MessageBody() data: any) {
    const hazard = await this.hazardsService.report({
      ...data,
      location: { type: 'Point', coordinates: [data.lng, data.lat] }
    });
    
    // Broadcast to all active units
    this.server.emit('hazard-update', hazard);
    return hazard;
  }
}
