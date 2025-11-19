import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class SubmitKanjiAttemptDto {
  @IsString()
  @IsNotEmpty()
  testId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @IsNotEmpty()
  answers: AnswerDto[];

  @IsDateString()
  @IsNotEmpty()
  startedAt: string;

  @IsDateString()
  @IsNotEmpty()
  finishedAt: string;
}
