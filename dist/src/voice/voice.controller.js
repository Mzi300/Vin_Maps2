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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const voice_service_1 = require("./voice.service");
const swagger_1 = require("@nestjs/swagger");
const swagger_file_dto_1 = require("./dto/swagger-file.dto");
let VoiceController = class VoiceController {
    voiceService;
    constructor(voiceService) {
        this.voiceService = voiceService;
    }
    async transcribe(file) {
        const transcript = await this.voiceService.transcribeAudio(file.buffer);
        await this.voiceService.broadcastVoiceCommand({ transcript });
        return { transcript };
    }
};
exports.VoiceController = VoiceController;
__decorate([
    (0, common_1.Post)('transcribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Transcribe uploaded audio and broadcast command' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ description: 'Audio file', type: swagger_file_dto_1.SwaggerFileDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], VoiceController.prototype, "transcribe", null);
exports.VoiceController = VoiceController = __decorate([
    (0, swagger_1.ApiTags)('voice'),
    (0, common_1.Controller)('voice'),
    __metadata("design:paramtypes", [voice_service_1.VoiceService])
], VoiceController);
//# sourceMappingURL=voice.controller.js.map