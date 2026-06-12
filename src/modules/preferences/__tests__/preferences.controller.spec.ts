import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Preference } from '../../preferences/entities/preference.entity';

// Mock repository for Preference
const mockPrefRepo = {
  create: jest.fn().mockImplementation((dto) => ({ ...dto })),
  save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'pref-1', ...entity })),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

describe('PreferencesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Preference))
      .useValue(mockPrefRepo)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /preferences creates a preference', async () => {
    const dto = { avoidTolls: true, preferredSpeedKmh: 90, vehicleType: 'car' };
    const response = await request(app.getHttpServer()).post('/preferences').send(dto).expect(201);
    expect(response.body).toMatchObject({ ...dto, id: expect.any(String) });
    expect(mockPrefRepo.create).toHaveBeenCalledWith({ ...dto, user: { id: undefined } as any });
    expect(mockPrefRepo.save).toHaveBeenCalled();
  });

  it('GET /preferences returns existing preference', async () => {
    const pref = { id: 'pref-1', avoidTolls: false, preferredSpeedKmh: 80, vehicleType: 'car' } as any;
    mockPrefRepo.findOne.mockResolvedValueOnce(pref);
    const response = await request(app.getHttpServer()).get('/preferences').expect(200);
    expect(response.body).toEqual(pref);
  });

  it('PATCH /preferences updates a preference', async () => {
    const existing = { id: 'pref-1', avoidTolls: false, preferredSpeedKmh: 80, vehicleType: 'car' } as any;
    mockPrefRepo.findOne.mockResolvedValueOnce(existing);
    const updates = { avoidTolls: true };
    const response = await request(app.getHttpServer()).patch('/preferences').send(updates).expect(200);
    expect(response.body).toMatchObject({ ...existing, ...updates });
    expect(mockPrefRepo.save).toHaveBeenCalled();
  });
});
