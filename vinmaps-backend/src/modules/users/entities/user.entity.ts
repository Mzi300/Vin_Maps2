import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { Preference } from '../../preferences/entities/preference.entity';
import { Place } from '../../places/entities/place.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Index()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DRIVER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  preferredLanguage: string;

  @Column({ default: true })
  notificationEnabled: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Preference, (pref) => pref.user)
  preferences: Preference[];

  @OneToMany(() => Place, (place) => place.user)
  savedPlaces: Place[];

  // GDPR fields
  @Column({ default: false })
  gdprConsent: boolean;

  @Column({ nullable: true })
  gdprConsentAt: Date;

  @Column({ nullable: true })
  gdprDeletedAt: Date;
}
