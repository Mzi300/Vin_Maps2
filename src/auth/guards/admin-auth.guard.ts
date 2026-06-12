import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Placeholder admin guard used for e2e tests.
 * In a production environment you would verify the request's
 * authentication / authorization credentials here.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Allow all requests during testing
    return true;
  }
}
