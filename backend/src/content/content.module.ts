import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { VocabItem, VocabItemSchema } from './schemas/vocab-item.schema';
import { KanjiItem, KanjiItemSchema } from './schemas/kanji-item.schema';
import {
  GrammarPoint,
  GrammarPointSchema,
} from './schemas/grammar-point.schema';
import { VocabTest, VocabTestSchema } from './schemas/vocab-test.schema';
import { KanjiTest, KanjiTestSchema } from './schemas/kanji-test.schema';
import { GrammarTest, GrammarTestSchema } from './schemas/grammar-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VocabItem.name, schema: VocabItemSchema },
      { name: KanjiItem.name, schema: KanjiItemSchema },
      { name: GrammarPoint.name, schema: GrammarPointSchema },
      { name: VocabTest.name, schema: VocabTestSchema },
      { name: KanjiTest.name, schema: KanjiTestSchema },
      { name: GrammarTest.name, schema: GrammarTestSchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
