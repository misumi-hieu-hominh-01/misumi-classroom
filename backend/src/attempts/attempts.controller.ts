import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SubmitVocabAttemptDto } from './dto/submit-vocab-attempt.dto';
import { SubmitKanjiAttemptDto } from './dto/submit-kanji-attempt.dto';
import { SubmitGrammarAttemptDto } from './dto/submit-grammar-attempt.dto';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('vocab')
  @HttpCode(HttpStatus.OK)
  async submitVocabAttempt(
    @Request() req: { user: { userId: string } },
    @Body() submitVocabAttemptDto: SubmitVocabAttemptDto,
  ) {
    return this.attemptsService.submitVocabAttempt(
      req.user.userId,
      submitVocabAttemptDto,
    );
  }

  @Post('kanji')
  @HttpCode(HttpStatus.OK)
  async submitKanjiAttempt(
    @Request() req: { user: { userId: string } },
    @Body() submitKanjiAttemptDto: SubmitKanjiAttemptDto,
  ) {
    return this.attemptsService.submitKanjiAttempt(
      req.user.userId,
      submitKanjiAttemptDto,
    );
  }

  @Post('grammar')
  @HttpCode(HttpStatus.OK)
  async submitGrammarAttempt(
    @Request() req: { user: { userId: string } },
    @Body() submitGrammarAttemptDto: SubmitGrammarAttemptDto,
  ) {
    return this.attemptsService.submitGrammarAttempt(
      req.user.userId,
      submitGrammarAttemptDto,
    );
  }
}
