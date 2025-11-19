import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import {
  UserAttemptVocab,
  UserAttemptVocabSchema,
} from './schemas/user-attempt-vocab.schema';
import {
  UserAttemptKanji,
  UserAttemptKanjiSchema,
} from './schemas/user-attempt-kanji.schema';
import {
  UserAttemptGrammar,
  UserAttemptGrammarSchema,
} from './schemas/user-attempt-grammar.schema';
import {
  VocabTest,
  VocabTestSchema,
} from '../content/schemas/vocab-test.schema';
import {
  KanjiTest,
  KanjiTestSchema,
} from '../content/schemas/kanji-test.schema';
import {
  GrammarTest,
  GrammarTestSchema,
} from '../content/schemas/grammar-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAttemptVocab.name, schema: UserAttemptVocabSchema },
      { name: UserAttemptKanji.name, schema: UserAttemptKanjiSchema },
      { name: UserAttemptGrammar.name, schema: UserAttemptGrammarSchema },
      { name: VocabTest.name, schema: VocabTestSchema },
      { name: KanjiTest.name, schema: KanjiTestSchema },
      { name: GrammarTest.name, schema: GrammarTestSchema },
    ]),
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
