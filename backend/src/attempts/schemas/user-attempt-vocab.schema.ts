import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserAttemptVocabDocument = UserAttemptVocab & Document;

@Schema({ collection: 'user_attempts_vocab', timestamps: true })
export class UserAttemptVocab {
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

export const UserAttemptVocabSchema =
  SchemaFactory.createForClass(UserAttemptVocab);

UserAttemptVocabSchema.index({ userId: 1, finishedAt: -1 });
UserAttemptVocabSchema.index({ testId: 1 });
