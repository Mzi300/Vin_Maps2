import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  /**
   * Generates a tactical access token for an operator
   * Requirement 11: API Expansion & Monetization
   */
  async login(operator: any) {
    const payload = { 
      username: operator.username, 
      sub: operator.userId,
      tier: 'enterprise-tactical'
    };
    return {
      access_token: this.jwtService.sign(payload),
      operator: {
        id: operator.userId,
        rank: 'Field-Commander'
      }
    };
  }
}
