import { IsOptional, IsString } from 'class-validator';

export class FilterContentDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
