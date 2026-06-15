import { Repository } from 'typeorm';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { ConfigService } from '@nestjs/config';
export declare class PlacesService {
    private readonly placeRepository;
    private readonly configService;
    constructor(placeRepository: Repository<Place>, configService: ConfigService);
    findAll(userId: string): Promise<Place[]>;
    findOne(userId: string, id: string): Promise<Place>;
    create(userId: string, dto: CreatePlaceDto): Promise<Place>;
    update(userId: string, id: string, dto: UpdatePlaceDto): Promise<Place>;
    remove(userId: string, id: string): Promise<void>;
}
