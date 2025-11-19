import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

export class CreateVocabTestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  items: string[];

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
