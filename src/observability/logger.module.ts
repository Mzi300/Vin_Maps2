import { Module } from '@nestjs/common';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`),
          ),
        }),
      ],
    }),
  ],
  exports: [],
})
export class LoggerModule {}
