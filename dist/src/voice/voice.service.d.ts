import { TelemetryGateway } from '../modules/telemetry/telemetry.gateway';
export declare class VoiceService {
    private readonly telemetryGateway;
    private readonly speechClient;
    constructor(telemetryGateway: TelemetryGateway);
    transcribeAudio(buffer: Buffer): Promise<string>;
    broadcastVoiceCommand(payload: any): Promise<void>;
}
