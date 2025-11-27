import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KanjiItemDocument = KanjiItem & Document;

@Schema({ collection: 'content_kanji_items', timestamps: true })
export class KanjiItem {
  @Prop({ required: true, trim: true })
  kanji: string;

  @Prop({ type: [String] })
  hanmean?: string[];

  @Prop({ type: [String] })
  onyomi?: string[];

  @Prop({ type: [String] })
  kunyomi?: string[];

  @Prop({ type: [String], required: true })
  meaningVi: string[];

  @Prop({ type: [Object] })
  compDetail?: Array<{
    h: string;
    w: string;
  }>;

  @Prop({ type: [String] })
  tips?: string[];

  @Prop()
  strokes?: number;

  @Prop({ required: true })
  level: string;

  @Prop({ type: Object })
  example_kun?: Record<
    string,
    Array<{
      m: string;
      w: string;
      p: string;
    }>
  >;

  @Prop({ type: Object })
  example_on?: Record<
    string,
    Array<{
      m: string;
      w: string;
      p: string;
    }>
  >;

  @Prop({ default: 1 })
  version: number;

  @Prop()
  updatedAt?: Date;
}

export const KanjiItemSchema = SchemaFactory.createForClass(KanjiItem);
