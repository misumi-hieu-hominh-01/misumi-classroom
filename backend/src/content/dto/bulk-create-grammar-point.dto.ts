import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGrammarPointDto } from './create-grammar-point.dto';

export class BulkCreateGrammarPointDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateGrammarPointDto)
	items: CreateGrammarPointDto[];
}










