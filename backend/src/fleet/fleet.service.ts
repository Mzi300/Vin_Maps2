import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverSession } from './driver-session.entity';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(DriverSession)
    private sessionRepository: Repository<DriverSession>,
  ) {}

  async getOrCreateSession(operatorId: string): Promise<DriverSession> {
    let session = await this.sessionRepository.findOne({ where: { operator_id: operatorId } });
    if (!session) {
      session = this.sessionRepository.create({ operator_id: operatorId });
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async recordEvent(operatorId: string, type: string) {
    const session = await this.getOrCreateSession(operatorId);
    
    if (type === 'hard_braking') {
      session.hard_braking_events += 1;
      session.safety_score = Math.max(0, session.safety_score - 2);
    } else if (type === 'pothole') {
      session.potholes_detected += 1;
    }

    return this.sessionRepository.save(session);
  }
}
