import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Display name must not be empty' })
  @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
  displayName?: string;

  @IsOptional()
  @IsDateString()
  courseStartDate?: string;
}
