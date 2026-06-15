import { User } from '../../users/entities/user.entity';
export declare class Preference {
    id: number;
    user: User;
    avoidTolls: boolean;
    preferredSpeedKmh: number;
    vehicleType: 'car' | 'truck' | 'motorcycle';
}
