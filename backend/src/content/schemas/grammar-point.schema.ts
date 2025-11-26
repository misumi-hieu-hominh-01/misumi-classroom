import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GrammarPointDocument = GrammarPoint & Document;

@Schema({ collection: 'content_grammar_points', timestamps: true })
export class GrammarPoint {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  pattern: string;

  @Prop({ required: true })
  explainVi: string;

  @Prop({ required: true })
  level: string;

  @Prop({ type: [Object] })
  examples?: Array<{
    sentence: string;
    reading: string;
    meaning: string;
  }>;

  @Prop({ default: 1 })
  version: number;

  @Prop()
  updatedAt?: Date;
}

export const GrammarPointSchema = SchemaFactory.createForClass(GrammarPoint);
