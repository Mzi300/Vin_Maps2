import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(@InjectRepository(Preference) private repo: Repository<Preference>) {}

  async create(userId: number, dto: CreatePreferenceDto): Promise<Preference> {
    const pref = this.repo.create({ ...dto, user: { id: userId } as any });
    return this.repo.save(pref);
  }

  async findOne(userId: number): Promise<Preference> {
    const pref = await this.repo.findOne({ where: { user: { id: userId } } });
    if (!pref) throw new NotFoundException('Preferences not found');
    return pref;
  }

  async update(userId: number, dto: UpdatePreferenceDto): Promise<Preference> {
    const pref = await this.findOne(userId);
    Object.assign(pref, dto);
    return this.repo.save(pref);
  }
}
