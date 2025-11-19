import { PartialType } from '@nestjs/mapped-types';
import { CreateGrammarTestDto } from './create-grammar-test.dto';

export class UpdateGrammarTestDto extends PartialType(CreateGrammarTestDto) {}
