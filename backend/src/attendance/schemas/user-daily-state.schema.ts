import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDailyStateDocument = UserDailyState & Document;

@Schema({ collection: 'user_daily_state', timestamps: true })
export class UserDailyState {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  dateKey: string;

  @Prop()
  checkedInAt?: Date;

  @Prop({
    type: {
      vocab: { type: Number, default: 10 },
      kanji: { type: Number, default: 5 },
      grammar: { type: Number, default: 1 },
    },
    default: { vocab: 10, kanji: 5, grammar: 1 },
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

  @Prop({
    type: {
      vocabIds: { type: [Types.ObjectId], default: [] },
      kanjiIds: { type: [Types.ObjectId], default: [] },
      grammarIds: { type: [Types.ObjectId], default: [] },
    },
    default: { vocabIds: [], kanjiIds: [], grammarIds: [] },
  })
  assigned: {
    vocabIds: Types.ObjectId[];
    kanjiIds: Types.ObjectId[];
    grammarIds: Types.ObjectId[];
  };

  @Prop()
  updatedAt?: Date;
}

export const UserDailyStateSchema =
  SchemaFactory.createForClass(UserDailyState);

// Create unique compound index
UserDailyStateSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
