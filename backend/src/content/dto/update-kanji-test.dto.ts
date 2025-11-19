import { PartialType } from '@nestjs/mapped-types';
import { CreateKanjiTestDto } from './create-kanji-test.dto';

export class UpdateKanjiTestDto extends PartialType(CreateKanjiTestDto) {}
