import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ComponentDetailDto {
  @IsString()
  @IsNotEmpty()
  component: string;

  @IsString()
  @IsNotEmpty()
  meaning: string;
}

class ExampleDto {
  @IsString()
  @IsNotEmpty()
  sentence: string;

  @IsString()
  @IsNotEmpty()
  meaning: string;
}

export class CreateKanjiItemDto {
  @IsString()
  @IsNotEmpty()
  kanji: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hanmean?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  onyomi?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  kunyomi?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  meaningVi: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentDetailDto)
  @IsOptional()
  compDetail?: ComponentDetailDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tips?: string[];

  @IsNumber()
  @IsOptional()
  strokes?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  @IsOptional()
  examples?: ExampleDto[];
}
