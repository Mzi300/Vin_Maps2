import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
export declare class PreferencesService {
    private repo;
    constructor(repo: Repository<Preference>);
    create(userId: number, dto: CreatePreferenceDto): Promise<Preference>;
    findOne(userId: number): Promise<Preference>;
    update(userId: number, dto: UpdatePreferenceDto): Promise<Preference>;
}
