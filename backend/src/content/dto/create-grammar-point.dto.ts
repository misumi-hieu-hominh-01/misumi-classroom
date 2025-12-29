import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExampleDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  transcription: string;

  @IsString()
  @IsNotEmpty()
  mean: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  segments?: string[];
}

export class CreateGrammarPointDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  pattern: string;

  @IsString()
  @IsNotEmpty()
  explainVi: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  @IsOptional()
  examples?: ExampleDto[];
}
