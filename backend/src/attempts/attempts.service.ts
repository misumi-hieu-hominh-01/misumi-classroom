import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserAttemptVocab,
  UserAttemptVocabDocument,
} from './schemas/user-attempt-vocab.schema';
import {
  UserAttemptKanji,
  UserAttemptKanjiDocument,
} from './schemas/user-attempt-kanji.schema';
import {
  UserAttemptGrammar,
  UserAttemptGrammarDocument,
} from './schemas/user-attempt-grammar.schema';
import {
  VocabTest,
  VocabTestDocument,
} from '../content/schemas/vocab-test.schema';
import {
  KanjiTest,
  KanjiTestDocument,
} from '../content/schemas/kanji-test.schema';
import {
  GrammarTest,
  GrammarTestDocument,
} from '../content/schemas/grammar-test.schema';
import { SubmitVocabAttemptDto } from './dto/submit-vocab-attempt.dto';
import { SubmitKanjiAttemptDto } from './dto/submit-kanji-attempt.dto';
import { SubmitGrammarAttemptDto } from './dto/submit-grammar-attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(UserAttemptVocab.name)
    private userAttemptVocabModel: Model<UserAttemptVocabDocument>,
    @InjectModel(UserAttemptKanji.name)
    private userAttemptKanjiModel: Model<UserAttemptKanjiDocument>,
    @InjectModel(UserAttemptGrammar.name)
    private userAttemptGrammarModel: Model<UserAttemptGrammarDocument>,
    @InjectModel(VocabTest.name)
    private vocabTestModel: Model<VocabTestDocument>,
    @InjectModel(KanjiTest.name)
    private kanjiTestModel: Model<KanjiTestDocument>,
    @InjectModel(GrammarTest.name)
    private grammarTestModel: Model<GrammarTestDocument>,
  ) {}

  async submitVocabAttempt(
    userId: string,
    submitVocabAttemptDto: SubmitVocabAttemptDto,
  ): Promise<{ attemptId: string; score: number; total: number }> {
    const test = await this.vocabTestModel
      .findById(submitVocabAttemptDto.testId)
      .exec();
    if (!test) {
      throw new NotFoundException('Vocab test not found');
    }
    const total = submitVocabAttemptDto.answers.length;
    const answersWithCorrectness = submitVocabAttemptDto.answers.map(
      (answer) => {
        const isCorrect = this.calculateAnswerCorrectness(
          answer.questionId,
          answer.answer,
          test.items,
        );
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
        };
      },
    );
    const score = answersWithCorrectness.filter((a) => a.isCorrect).length;
    const attempt = new this.userAttemptVocabModel({
      userId,
      testId: submitVocabAttemptDto.testId,
      testVersion: test.version,
      score,
      total,
      answers: answersWithCorrectness,
      startedAt: new Date(submitVocabAttemptDto.startedAt),
      finishedAt: new Date(submitVocabAttemptDto.finishedAt),
    });
    const savedAttempt = await attempt.save();
    return {
      attemptId: savedAttempt._id.toString(),
      score,
      total,
    };
  }

  async submitKanjiAttempt(
    userId: string,
    submitKanjiAttemptDto: SubmitKanjiAttemptDto,
  ): Promise<{ attemptId: string; score: number; total: number }> {
    const test = await this.kanjiTestModel
      .findById(submitKanjiAttemptDto.testId)
      .exec();
    if (!test) {
      throw new NotFoundException('Kanji test not found');
    }
    const total = submitKanjiAttemptDto.answers.length;
    const answersWithCorrectness = submitKanjiAttemptDto.answers.map(
      (answer) => {
        const isCorrect = this.calculateAnswerCorrectness(
          answer.questionId,
          answer.answer,
          test.items,
        );
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
        };
      },
    );
    const score = answersWithCorrectness.filter((a) => a.isCorrect).length;
    const attempt = new this.userAttemptKanjiModel({
      userId,
      testId: submitKanjiAttemptDto.testId,
      testVersion: test.version,
      score,
      total,
      answers: answersWithCorrectness,
      startedAt: new Date(submitKanjiAttemptDto.startedAt),
      finishedAt: new Date(submitKanjiAttemptDto.finishedAt),
    });
    const savedAttempt = await attempt.save();
    return {
      attemptId: savedAttempt._id.toString(),
      score,
      total,
    };
  }

  async submitGrammarAttempt(
    userId: string,
    submitGrammarAttemptDto: SubmitGrammarAttemptDto,
  ): Promise<{ attemptId: string; score: number; total: number }> {
    const test = await this.grammarTestModel
      .findById(submitGrammarAttemptDto.testId)
      .exec();
    if (!test) {
      throw new NotFoundException('Grammar test not found');
    }
    const total = submitGrammarAttemptDto.answers.length;
    const answersWithCorrectness = submitGrammarAttemptDto.answers.map(
      (answer) => {
        const isCorrect = this.calculateAnswerCorrectness(
          answer.questionId,
          answer.answer,
          test.items,
        );
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
        };
      },
    );
    const score = answersWithCorrectness.filter((a) => a.isCorrect).length;
    const attempt = new this.userAttemptGrammarModel({
      userId,
      testId: submitGrammarAttemptDto.testId,
      testVersion: test.version,
      score,
      total,
      answers: answersWithCorrectness,
      startedAt: new Date(submitGrammarAttemptDto.startedAt),
      finishedAt: new Date(submitGrammarAttemptDto.finishedAt),
    });
    const savedAttempt = await attempt.save();
    return {
      attemptId: savedAttempt._id.toString(),
      score,
      total,
    };
  }

  private calculateAnswerCorrectness(
    questionId: string,
    userAnswer: string,
    testItems: string[],
  ): boolean {
    const itemExists = testItems.includes(questionId);
    if (!itemExists) {
      return false;
    }
    return true;
  }
}
