import { PartialType } from '@nestjs/mapped-types';
import { CreateVocabTestDto } from './create-vocab-test.dto';

export class UpdateVocabTestDto extends PartialType(CreateVocabTestDto) {}
