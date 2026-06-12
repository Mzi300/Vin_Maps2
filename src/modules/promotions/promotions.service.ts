import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    private readonly configService: ConfigService,
  ) {}

  /** Create a new promotion */
  async create(dto: CreatePromotionDto): Promise<Promotion> {
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }
    const promotion = this.promotionRepository.create(dto as any);
    return this.promotionRepository.save(promotion);
  }

  /** Get a promotion by ID */
  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  /** Get all promotions (admin) */
  async findAll(): Promise<Promotion[]> {
    return this.promotionRepository.find();
  }

  /** Get active promotions (public) */
  async findActive(): Promise<Promotion[]> {
    const now = new Date();
    return this.promotionRepository.find({
      where: {
        startDate: { $lte: now } as any,
        endDate: { $gte: now } as any,
      },
    });
  }

  /** Update promotion */
  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findOne(id);
    if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }
    Object.assign(promotion, dto);
    return this.promotionRepository.save(promotion);
  }

  /** Delete promotion */
  async remove(id: string): Promise<void> {
    const promotion = await this.findOne(id);
    await this.promotionRepository.remove(promotion);
  }

  /** Purge old promotions based on retention period */
  async purgeOld(): Promise<void> {
    const retention = this.configService.get<number>('PROMOTION_RETENTION_DAYS') || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retention);
    await this.promotionRepository.delete({ endDate: { $lt: cutoff } as any });
  }
}
