import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EmergencyGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('trigger-sos')
  async handleSos(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const sosEvent = {
      id: `SOS-${Date.now()}`,
      operatorId: client.id,
      location: data.location,
      message: data.message || 'EMERGENCY: TACTICAL ASSISTANCE REQUIRED',
      timestamp: Date.now(),
      severity: 'CRITICAL'
    };

    console.log(`[EMERGENCY] SOS RECEIVED FROM ${client.id} at ${data.location}`);
    
    // Broadcast to all active tactical units and command centers
    this.server.emit('sos-broadcast', sosEvent);
    
    return sosEvent;
  }

  @SubscribeMessage('cancel-sos')
  async handleCancelSos(@ConnectedSocket() client: Socket) {
    this.server.emit('sos-cancelled', { operatorId: client.id });
    return { success: true };
  }
}
