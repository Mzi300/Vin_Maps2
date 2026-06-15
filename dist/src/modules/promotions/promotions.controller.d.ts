import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
export declare class PromotionsController {
    private readonly promotionsService;
    constructor(promotionsService: PromotionsService);
    create(dto: CreatePromotionDto): Promise<import("./entities/promotion.entity").Promotion>;
    findAll(): Promise<import("./entities/promotion.entity").Promotion[]>;
    findActive(): Promise<import("./entities/promotion.entity").Promotion[]>;
    findOne(id: string): Promise<import("./entities/promotion.entity").Promotion>;
    update(id: string, dto: UpdatePromotionDto): Promise<import("./entities/promotion.entity").Promotion>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
