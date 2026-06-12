import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Placeholder JWT guard used for e2e tests.
 * In production this would validate a JWT token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Allow all requests during testing
    return true;
  }
}
