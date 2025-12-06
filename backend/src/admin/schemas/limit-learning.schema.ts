import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LimitLearningDocument = LimitLearning & Document;

@Schema({ collection: 'admin_limit_learning', timestamps: true })
export class LimitLearning {
  @Prop({
    type: {
      vocab: { type: Number, default: 10, min: 1, max: 100 },
      kanji: { type: Number, default: 5, min: 1, max: 50 },
      grammar: { type: Number, default: 1, min: 1, max: 10 },
    },
    default: { vocab: 10, kanji: 5, grammar: 1 },
  })
  limits: {
    vocab: number;
    kanji: number;
    grammar: number;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  updatedAt?: Date;
}

export const LimitLearningSchema = SchemaFactory.createForClass(LimitLearning);
