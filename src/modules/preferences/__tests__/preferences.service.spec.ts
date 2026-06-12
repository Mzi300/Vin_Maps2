import { Test, TestingModule } from '@nestjs/testing';
import { PreferencesService } from '../preferences.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Preference } from '../entities/preference.entity';

describe('PreferencesService', () => {
  let service: PreferencesService;
  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreferencesService, { provide: getRepositoryToken(Preference), useValue: mockRepo }],
    }).compile();
    service = module.get<PreferencesService>(PreferencesService);
  });

  it('should create preferences', async () => {
    const dto = { avoidTolls: true, preferredSpeedKmh: 90, vehicleType: 'car' };
    const result = await service.create('user-123', dto as any);
    expect(mockRepo.create).toHaveBeenCalledWith({ ...dto, user: { id: 'user-123' } as any });
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining(dto));
    expect(result).toMatchObject(dto);
  });

  it('should find one preference', async () => {
    const pref = { id: 'pref-1', user: { id: 'user-123' }, avoidTolls: false } as any;
    mockRepo.findOne.mockResolvedValueOnce(pref);
    const result = await service.findOne('user-123');
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { user: { id: 'user-123' } } });
    expect(result).toBe(pref);
  });
});
