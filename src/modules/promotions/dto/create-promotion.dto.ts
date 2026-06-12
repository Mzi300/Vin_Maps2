import { IsString, IsUrl, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsUrl()
  linkUrl: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  targetRoute?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;
}
