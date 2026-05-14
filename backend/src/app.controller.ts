import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'OPERATIONAL',
      tactical_link: 'ACTIVE',
      timestamp: new Date().toISOString(),
      project: 'VinMaps Tactical Navigation',
      version: '3.0.4-production',
      uptime: process.uptime()
    };
  }

  @Get()
  getHello(): string {
    return 'VinMaps Tactical Backend v3.0 - Operational';
  }
}
