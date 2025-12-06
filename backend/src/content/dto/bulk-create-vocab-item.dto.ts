import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVocabItemDto } from './create-vocab-item.dto';

export class BulkCreateVocabItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVocabItemDto)
  items: CreateVocabItemDto[];
}

