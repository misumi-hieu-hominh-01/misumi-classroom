import { PartialType } from '@nestjs/mapped-types';
import { CreateGrammarPointDto } from './create-grammar-point.dto';

export class UpdateGrammarPointDto extends PartialType(CreateGrammarPointDto) {}
