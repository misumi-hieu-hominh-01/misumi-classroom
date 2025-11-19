import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VocabItemDocument = VocabItem & Document;

@Schema({ collection: 'content_vocab_items', timestamps: true })
export class VocabItem {
  @Prop({ required: true, trim: true })
  term: string;

  @Prop({ required: true, trim: true })
  reading: string;

  @Prop({ type: [String], required: true })
  meaningVi: string[];

  @Prop({ required: true })
  level: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  type?: string;

  @Prop({ type: [Object] })
  examples?: Array<{
    sentence: string;
    meaning: string;
  }>;

  @Prop({ default: 1 })
  version: number;

  @Prop()
  updatedAt?: Date;
}

export const VocabItemSchema = SchemaFactory.createForClass(VocabItem);
