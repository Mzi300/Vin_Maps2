import { Server, Socket } from 'socket.io';
export declare class EmergencyGateway {
    server: Server;
    handleSos(data: any, client: Socket): Promise<{
        id: string;
        operatorId: string;
        location: any;
        message: any;
        timestamp: number;
        severity: string;
    }>;
    handleCancelSos(client: Socket): Promise<{
        success: boolean;
    }>;
}
