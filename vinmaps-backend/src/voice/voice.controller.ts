import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SwaggerFileDto } from './dto/swagger-file.dto';

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('transcribe')
  @ApiOperation({ summary: 'Transcribe uploaded audio and broadcast command' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Audio file', type: SwaggerFileDto })
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    // file.buffer contains the raw audio data
    const transcript = await this.voiceService.transcribeAudio(file.buffer);
    // After obtaining transcript, broadcast to clients
    await this.voiceService.broadcastVoiceCommand({ transcript });
    return { transcript };
  }
}
