import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AILoadProtectionService {
  private readonly logger = new Logger(AILoadProtectionService.name);
  
  private concurrentExecutions = 0;
  private readonly MAX_CONCURRENT = 50;

  async executeProtected<T>(operation: () => Promise<T>): Promise<T> {
    if (this.concurrentExecutions >= this.MAX_CONCURRENT) {
      this.logger.warn(`AI Load Protection triggered! Max concurrent limit (${this.MAX_CONCURRENT}) reached. Forcing degraded mode.`);
      throw new Error('AI_LOAD_LIMIT_EXCEEDED');
    }

    this.concurrentExecutions++;
    try {
      // Hard timeout of 2 seconds for AI logic
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 2000);
      });

      return await Promise.race([operation(), timeoutPromise]);
    } finally {
      this.concurrentExecutions--;
    }
  }
}
