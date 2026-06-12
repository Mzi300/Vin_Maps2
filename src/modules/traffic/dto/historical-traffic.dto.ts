import { IsString } from 'class-validator';

export class HistoricalTrafficDto {
  @IsString()
  route: string; // JSON stringified array of [lng, lat] coordinates
}
