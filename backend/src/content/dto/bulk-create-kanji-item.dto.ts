import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateKanjiItemDto } from './create-kanji-item.dto';

export class BulkCreateKanjiItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKanjiItemDto)
  items: CreateKanjiItemDto[];
}
