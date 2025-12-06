import { IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class UpdateLimitLearningDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  vocab?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  kanji?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  grammar?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
