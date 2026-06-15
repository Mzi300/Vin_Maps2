import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { Place } from './entities/place.entity';
export declare class PlacesController {
    private readonly placesService;
    constructor(placesService: PlacesService);
    findAll(req: any): Promise<Place[]>;
    findOne(req: any, id: string): Promise<Place>;
    create(req: any, dto: CreatePlaceDto): Promise<Place>;
    update(req: any, id: string, dto: UpdatePlaceDto): Promise<Place>;
    remove(req: any, id: string): Promise<void>;
}
