import { PartialType } from '@nestjs/mapped-types';
import { CreateKanjiItemDto } from './create-kanji-item.dto';

export class UpdateKanjiItemDto extends PartialType(CreateKanjiItemDto) {}
