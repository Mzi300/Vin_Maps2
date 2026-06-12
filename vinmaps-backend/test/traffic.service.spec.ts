import { Test, TestingModule } from '@nestjs/testing';
import { TrafficService } from '../../src/modules/traffic/traffic.service';

describe('TrafficService', () => {
  let service: TrafficService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrafficService],
    }).compile();
    service = module.get<TrafficService>(TrafficService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
