import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('operator-login')
  async login(@Body() body: any) {
    // Mock login for tactical demonstration
    return this.authService.login({
      username: body.username || 'TacticalOperator',
      userId: body.userId || `UNIT-${Math.floor(Math.random() * 1000)}`
    });
  }
}
