"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const common_1 = require("@nestjs/common");
const speech_1 = require("@google-cloud/speech");
const telemetry_gateway_1 = require("../modules/telemetry/telemetry.gateway");
let VoiceService = class VoiceService {
    telemetryGateway;
    speechClient;
    constructor(telemetryGateway) {
        this.telemetryGateway = telemetryGateway;
        this.speechClient = new speech_1.SpeechClient();
    }
    async transcribeAudio(buffer) {
        const audioBytes = buffer.toString('base64');
        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
            },
        };
        const [response] = await this.speechClient.recognize(request);
        const transcription = response.results
            ?.map((result) => result.alternatives[0].transcript)
            .join(' ') || '';
        return transcription;
    }
    async broadcastVoiceCommand(payload) {
        this.telemetryGateway.broadcastVoiceCommand(payload);
    }
};
exports.VoiceService = VoiceService;
exports.VoiceService = VoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(telemetry_gateway_1.TelemetryGateway)),
    __metadata("design:paramtypes", [telemetry_gateway_1.TelemetryGateway])
], VoiceService);
//# sourceMappingURL=voice.service.js.map