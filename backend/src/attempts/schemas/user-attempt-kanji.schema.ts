import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserAttemptKanjiDocument = UserAttemptKanji & Document;

@Schema({ collection: 'user_attempts_kanji', timestamps: true })
export class UserAttemptKanji {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String, index: true })
  testId: string;

  @Prop({ required: true })
  testVersion: number;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  total: number;

  @Prop({
    type: [
      {
        questionId: String,
        answer: String,
        isCorrect: Boolean,
      },
    ],
    required: true,
  })
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true, index: true })
  finishedAt: Date;
}

export const UserAttemptKanjiSchema =
  SchemaFactory.createForClass(UserAttemptKanji);

UserAttemptKanjiSchema.index({ userId: 1, finishedAt: -1 });
UserAttemptKanjiSchema.index({ testId: 1 });
