import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(userId: string): Promise<Place[]> {
    return this.placeRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(userId: string, id: string): Promise<Place> {
    const place = await this.placeRepository.findOne({ where: { id, user: { id: userId } } });
    if (!place) {
      throw new ConflictException('Place not found');
    }
    return place;
  }

  async create(userId: string, dto: CreatePlaceDto): Promise<Place> {
    const maxFree = this.configService.get<number>('MAX_FREE_PLACES') || 10;
    const count = await this.placeRepository.count({ where: { user: { id: userId } } });
    if (count >= maxFree) {
      throw new ForbiddenException('Free place limit reached');
    }
    const place = this.placeRepository.create({ ...dto, user: { id: userId } as any });
    return this.placeRepository.save(place);
  }

  async update(userId: string, id: string, dto: UpdatePlaceDto): Promise<Place> {
    const place = await this.findOne(userId, id);
    Object.assign(place, dto);
    return this.placeRepository.save(place);
  }

  async remove(userId: string, id: string): Promise<void> {
    const place = await this.findOne(userId, id);
    await this.placeRepository.remove(place);
  }
}
