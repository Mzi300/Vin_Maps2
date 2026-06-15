import { PreferencesService } from './preferences.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
export declare class PreferencesController {
    private readonly service;
    constructor(service: PreferencesService);
    create(req: any, dto: CreatePreferenceDto): Promise<import("./entities/preference.entity").Preference>;
    get(req: any): Promise<import("./entities/preference.entity").Preference>;
    update(req: any, dto: UpdatePreferenceDto): Promise<import("./entities/preference.entity").Preference>;
}
