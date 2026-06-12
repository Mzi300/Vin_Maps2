import { IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';

export class CreatePreferenceDto {
  @IsBoolean()
  avoidTolls: boolean;

  @IsInt()
  @Min(30)
  @Max(150)
  preferredSpeedKmh: number;

  @IsEnum(['car', 'truck', 'motorcycle'])
  vehicleType: 'car' | 'truck' | 'motorcycle';
}
