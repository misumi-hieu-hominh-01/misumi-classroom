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
  sentence: string;

  @IsString()
  @IsNotEmpty()
  meaning: string;
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  @IsOptional()
  examples?: ExampleDto[];
}
