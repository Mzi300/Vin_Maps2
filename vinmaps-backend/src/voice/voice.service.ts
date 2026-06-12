import { Injectable, Inject } from '@nestjs/common';
import { SpeechClient } from '@google-cloud/speech';
import { TelemetryGateway } from '../modules/telemetry/telemetry.gateway';

@Injectable()
export class VoiceService {
  private readonly speechClient: SpeechClient;

  constructor(@Inject(TelemetryGateway) private readonly telemetryGateway: TelemetryGateway) {
    this.speechClient = new SpeechClient();
  }

  async transcribeAudio(buffer: Buffer): Promise<string> {
    const audioBytes = buffer.toString('base64');
    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'WEBM_OPUS', // assuming webm codec
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      },
    } as any;
    const [response] = await this.speechClient.recognize(request);
    const transcription = response.results
      ?.map((result: any) => result.alternatives[0].transcript)
      .join(' ') || '';
    return transcription;
  }

  async broadcastVoiceCommand(payload: any) {
    this.telemetryGateway.broadcastVoiceCommand(payload);
  }
}
