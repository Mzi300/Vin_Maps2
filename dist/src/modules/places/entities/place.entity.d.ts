import { User } from '../../users/entities/user.entity';
export declare class Place {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
