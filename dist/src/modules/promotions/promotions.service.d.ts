import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ConfigService } from '@nestjs/config';
export declare class PromotionsService {
    private readonly promotionRepository;
    private readonly configService;
    constructor(promotionRepository: Repository<Promotion>, configService: ConfigService);
    create(dto: CreatePromotionDto): Promise<Promotion>;
    findOne(id: string): Promise<Promotion>;
    findAll(): Promise<Promotion[]>;
    findActive(): Promise<Promotion[]>;
    update(id: string, dto: UpdatePromotionDto): Promise<Promotion>;
    remove(id: string): Promise<void>;
    purgeOld(): Promise<void>;
}
