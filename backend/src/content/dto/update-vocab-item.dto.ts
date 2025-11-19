import { PartialType } from '@nestjs/mapped-types';
import { CreateVocabItemDto } from './create-vocab-item.dto';

export class UpdateVocabItemDto extends PartialType(CreateVocabItemDto) {}
