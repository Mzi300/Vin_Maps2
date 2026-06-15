import { VoiceService } from './voice.service';
export declare class VoiceController {
    private readonly voiceService;
    constructor(voiceService: VoiceService);
    transcribe(file: Express.Multer.File): Promise<{
        transcript: string;
    }>;
}
