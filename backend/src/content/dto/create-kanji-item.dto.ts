import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class ComponentDetailDto {
  @IsString()
  @IsNotEmpty()
  h: string;

  @IsString()
  @IsNotEmpty()
  w: string;
}

class ExampleItemDto {
  @IsString()
  @IsNotEmpty()
  m: string;

  @IsString()
  @IsNotEmpty()
  w: string;

  @IsString()
  @IsNotEmpty()
  p: string;
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
  @IsNotEmpty()
  level: string;

  @IsObject()
  @IsOptional()
  example_kun?: Record<string, ExampleItemDto[]>;

  @IsObject()
  @IsOptional()
  example_on?: Record<string, ExampleItemDto[]>;
}
