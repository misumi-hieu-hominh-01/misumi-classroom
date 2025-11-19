import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VocabTestDocument = VocabTest & Document;

@Schema({ collection: 'content_vocab_tests', timestamps: true })
export class VocabTest {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  level: string;

  @Prop({ default: 1 })
  version: number;

  @Prop()
  mode?: string;

  @Prop({ type: [String], required: true })
  items: string[];

  @Prop({ default: false })
  published: boolean;

  @Prop()
  updatedAt?: Date;
}

export const VocabTestSchema = SchemaFactory.createForClass(VocabTest);
