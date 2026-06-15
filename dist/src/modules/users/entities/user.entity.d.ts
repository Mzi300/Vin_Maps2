import { UserRole } from '../enums/user-role.enum';
import { Preference } from '../../preferences/entities/preference.entity';
import { Place } from '../../places/entities/place.entity';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    profileImage: string;
    preferredLanguage: string;
    notificationEnabled: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    preferences: Preference[];
    savedPlaces: Place[];
    gdprConsent: boolean;
    gdprConsentAt: Date;
    gdprDeletedAt: Date;
}
