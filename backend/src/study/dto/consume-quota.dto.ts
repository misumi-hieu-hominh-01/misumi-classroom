import { IsEnum, IsNotEmpty } from 'class-validator';

export enum StudyModule {
  VOCAB = 'vocab',
  KANJI = 'kanji',
  GRAMMAR = 'grammar',
}

export class ConsumeQuotaDto {
  @IsNotEmpty()
  @IsEnum(StudyModule)
  module: StudyModule;
}
