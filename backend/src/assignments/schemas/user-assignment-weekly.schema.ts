import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserAssignmentWeeklyDocument = UserAssignmentWeekly & Document;

@Schema({ collection: 'user_assignments_weekly', timestamps: true })
export class UserAssignmentWeekly {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  period: string;

  @Prop({ required: true })
  generatedAt: Date;

  @Prop({
    type: {
      vocabIds: { type: [Types.ObjectId], default: [] },
      kanjiIds: { type: [Types.ObjectId], default: [] },
      grammarIds: { type: [Types.ObjectId], default: [] },
    },
    default: { vocabIds: [], kanjiIds: [], grammarIds: [] },
  })
  pools: {
    vocabIds: Types.ObjectId[];
    kanjiIds: Types.ObjectId[];
    grammarIds: Types.ObjectId[];
  };

  @Prop({
    type: {
      vocab: { type: Number, default: 0 },
      kanji: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
    },
    default: { vocab: 0, kanji: 0, grammar: 0 },
  })
  limits: {
    vocab: number;
    kanji: number;
    grammar: number;
  };

  @Prop({
    type: {
      vocab: { type: Number, default: 0 },
      kanji: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
    },
    default: { vocab: 0, kanji: 0, grammar: 0 },
  })
  used: {
    vocab: number;
    kanji: number;
    grammar: number;
  };

  @Prop({ type: String, enum: ['active', 'completed'], default: 'active' })
  status: string;
}

export const UserAssignmentWeeklySchema =
  SchemaFactory.createForClass(UserAssignmentWeekly);

UserAssignmentWeeklySchema.index({ userId: 1, period: 1 }, { unique: true });
