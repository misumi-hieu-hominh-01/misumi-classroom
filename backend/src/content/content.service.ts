import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { VocabItem, VocabItemDocument } from './schemas/vocab-item.schema';
import { KanjiItem, KanjiItemDocument } from './schemas/kanji-item.schema';
import {
  GrammarPoint,
  GrammarPointDocument,
} from './schemas/grammar-point.schema';
import { VocabTest, VocabTestDocument } from './schemas/vocab-test.schema';
import { KanjiTest, KanjiTestDocument } from './schemas/kanji-test.schema';
import {
  GrammarTest,
  GrammarTestDocument,
} from './schemas/grammar-test.schema';
import { CreateVocabItemDto } from './dto/create-vocab-item.dto';
import { UpdateVocabItemDto } from './dto/update-vocab-item.dto';
import { CreateKanjiItemDto } from './dto/create-kanji-item.dto';
import { UpdateKanjiItemDto } from './dto/update-kanji-item.dto';
import { CreateGrammarPointDto } from './dto/create-grammar-point.dto';
import { UpdateGrammarPointDto } from './dto/update-grammar-point.dto';
import { CreateVocabTestDto } from './dto/create-vocab-test.dto';
import { UpdateVocabTestDto } from './dto/update-vocab-test.dto';
import { CreateKanjiTestDto } from './dto/create-kanji-test.dto';
import { UpdateKanjiTestDto } from './dto/update-kanji-test.dto';
import { CreateGrammarTestDto } from './dto/create-grammar-test.dto';
import { UpdateGrammarTestDto } from './dto/update-grammar-test.dto';
import { BulkCreateVocabItemDto } from './dto/bulk-create-vocab-item.dto';
import { BulkCreateKanjiItemDto } from './dto/bulk-create-kanji-item.dto';
import { BulkCreateGrammarPointDto } from './dto/bulk-create-grammar-point.dto';
import { QueryContentDto } from './dto/query-content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(VocabItem.name)
    private vocabItemModel: Model<VocabItemDocument>,
    @InjectModel(KanjiItem.name)
    private kanjiItemModel: Model<KanjiItemDocument>,
    @InjectModel(GrammarPoint.name)
    private grammarPointModel: Model<GrammarPointDocument>,
    @InjectModel(VocabTest.name)
    private vocabTestModel: Model<VocabTestDocument>,
    @InjectModel(KanjiTest.name)
    private kanjiTestModel: Model<KanjiTestDocument>,
    @InjectModel(GrammarTest.name)
    private grammarTestModel: Model<GrammarTestDocument>,
  ) {}

  async createVocabItem(
    createVocabItemDto: CreateVocabItemDto,
  ): Promise<VocabItemDocument> {
    const vocabItem = new this.vocabItemModel(createVocabItemDto);
    return vocabItem.save();
  }

  async findAllVocabItems(
    queryDto: QueryContentDto,
  ): Promise<{ items: VocabItemDocument[]; total: number }> {
    const { level, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const query: FilterQuery<VocabItemDocument> = {};
    if (level) {
      query.level = level;
    }
    if (search) {
      query.$or = [
        { term: { $regex: search, $options: 'i' } },
        { reading: { $regex: search, $options: 'i' } },
        { meaningVi: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await this.vocabItemModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.vocabItemModel.countDocuments(query).exec();
    return { items, total };
  }

  async findVocabItemById(id: string): Promise<VocabItemDocument> {
    const item = await this.vocabItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Vocab item not found');
    }
    return item;
  }

  async updateVocabItem(
    id: string,
    updateVocabItemDto: UpdateVocabItemDto,
  ): Promise<VocabItemDocument> {
    const item = await this.vocabItemModel
      .findByIdAndUpdate(id, updateVocabItemDto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException('Vocab item not found');
    }
    return item;
  }

  async deleteVocabItem(id: string): Promise<void> {
    const result = await this.vocabItemModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Vocab item not found');
    }
  }

  async bulkCreateVocabItems(
    bulkCreateDto: BulkCreateVocabItemDto,
  ): Promise<VocabItemDocument[]> {
    const items = bulkCreateDto.items.map(
      (item) => new this.vocabItemModel(item),
    );
    return this.vocabItemModel.insertMany(items);
  }

  async createKanjiItem(
    createKanjiItemDto: CreateKanjiItemDto,
  ): Promise<KanjiItemDocument> {
    const kanjiItem = new this.kanjiItemModel(createKanjiItemDto);
    return kanjiItem.save();
  }

  async findAllKanjiItems(
    queryDto: QueryContentDto,
  ): Promise<{ items: KanjiItemDocument[]; total: number }> {
    const { level, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const query: FilterQuery<KanjiItemDocument> = {};
    if (level) {
      query.level = level;
    }
    if (search) {
      query.$or = [
        { kanji: { $regex: search, $options: 'i' } },
        { meaningVi: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await this.kanjiItemModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.kanjiItemModel.countDocuments(query).exec();
    return { items, total };
  }

  async findKanjiItemById(id: string): Promise<KanjiItemDocument> {
    const item = await this.kanjiItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Kanji item not found');
    }
    return item;
  }

  async updateKanjiItem(
    id: string,
    updateKanjiItemDto: UpdateKanjiItemDto,
  ): Promise<KanjiItemDocument> {
    const item = await this.kanjiItemModel
      .findByIdAndUpdate(id, updateKanjiItemDto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException('Kanji item not found');
    }
    return item;
  }

  async deleteKanjiItem(id: string): Promise<void> {
    const result = await this.kanjiItemModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Kanji item not found');
    }
  }

  async bulkCreateKanjiItems(
    bulkCreateDto: BulkCreateKanjiItemDto,
  ): Promise<KanjiItemDocument[]> {
    const items = bulkCreateDto.items.map(
      (item) => new this.kanjiItemModel(item),
    );
    return this.kanjiItemModel.insertMany(items);
  }

  async createGrammarPoint(
    createGrammarPointDto: CreateGrammarPointDto,
  ): Promise<GrammarPointDocument> {
    const grammarPoint = new this.grammarPointModel(createGrammarPointDto);
    return grammarPoint.save();
  }

  async findAllGrammarPoints(
    queryDto: QueryContentDto,
  ): Promise<{ items: GrammarPointDocument[]; total: number }> {
    const { level, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const query: FilterQuery<GrammarPointDocument> = {};
    if (level) {
      query.level = level;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { pattern: { $regex: search, $options: 'i' } },
        { explainVi: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await this.grammarPointModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.grammarPointModel.countDocuments(query).exec();
    return { items, total };
  }

  async findGrammarPointById(id: string): Promise<GrammarPointDocument> {
    const item = await this.grammarPointModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Grammar point not found');
    }
    return item;
  }

  async updateGrammarPoint(
    id: string,
    updateGrammarPointDto: UpdateGrammarPointDto,
  ): Promise<GrammarPointDocument> {
    const item = await this.grammarPointModel
      .findByIdAndUpdate(id, updateGrammarPointDto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException('Grammar point not found');
    }
    return item;
  }

  async deleteGrammarPoint(id: string): Promise<void> {
    const result = await this.grammarPointModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Grammar point not found');
    }
  }

  async bulkCreateGrammarPoints(
    bulkCreateDto: BulkCreateGrammarPointDto,
  ): Promise<GrammarPointDocument[]> {
    const items = bulkCreateDto.items.map(
      (item) => new this.grammarPointModel(item),
    );
    return this.grammarPointModel.insertMany(items);
  }

  async createVocabTest(
    createVocabTestDto: CreateVocabTestDto,
  ): Promise<VocabTestDocument> {
    const vocabTest = new this.vocabTestModel(createVocabTestDto);
    return vocabTest.save();
  }

  async findAllVocabTests(
    queryDto: QueryContentDto,
  ): Promise<{ items: VocabTestDocument[]; total: number }> {
    const { level, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const query: FilterQuery<VocabTestDocument> = {};
    if (level) {
      query.level = level;
    }
    const items = await this.vocabTestModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.vocabTestModel.countDocuments(query).exec();
    return { items, total };
  }

  async findVocabTestById(id: string): Promise<VocabTestDocument> {
    const test = await this.vocabTestModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Vocab test not found');
    }
    return test;
  }

  async updateVocabTest(
    id: string,
    updateVocabTestDto: UpdateVocabTestDto,
  ): Promise<VocabTestDocument> {
    const test = await this.vocabTestModel
      .findByIdAndUpdate(id, updateVocabTestDto, { new: true })
      .exec();
    if (!test) {
      throw new NotFoundException('Vocab test not found');
    }
    return test;
  }

  async deleteVocabTest(id: string): Promise<void> {
    const result = await this.vocabTestModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Vocab test not found');
    }
  }

  async createKanjiTest(
    createKanjiTestDto: CreateKanjiTestDto,
  ): Promise<KanjiTestDocument> {
    const kanjiTest = new this.kanjiTestModel(createKanjiTestDto);
    return kanjiTest.save();
  }

  async findAllKanjiTests(
    queryDto: QueryContentDto,
  ): Promise<{ items: KanjiTestDocument[]; total: number }> {
    const { level, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const query: FilterQuery<KanjiTestDocument> = {};
    if (level) {
      query.level = level;
    }
    const items = await this.kanjiTestModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.kanjiTestModel.countDocuments(query).exec();
    return { items, total };
  }

  async findKanjiTestById(id: string): Promise<KanjiTestDocument> {
    const test = await this.kanjiTestModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Kanji test not found');
    }
    return test;
  }

  async updateKanjiTest(
    id: string,
    updateKanjiTestDto: UpdateKanjiTestDto,
  ): Promise<KanjiTestDocument> {
    const test = await this.kanjiTestModel
      .findByIdAndUpdate(id, updateKanjiTestDto, { new: true })
      .exec();
    if (!test) {
      throw new NotFoundException('Kanji test not found');
    }
    return test;
  }

  async deleteKanjiTest(id: string): Promise<void> {
    const result = await this.kanjiTestModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Kanji test not found');
    }
  }

  async createGrammarTest(
    createGrammarTestDto: CreateGrammarTestDto,
  ): Promise<GrammarTestDocument> {
    const grammarTest = new this.grammarTestModel(createGrammarTestDto);
    return grammarTest.save();
  }

  async findAllGrammarTests(
    queryDto: QueryContentDto,
  ): Promise<{ items: GrammarTestDocument[]; total: number }> {
    const { level, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const query: FilterQuery<GrammarTestDocument> = {};
    if (level) {
      query.level = level;
    }
    const items = await this.grammarTestModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.grammarTestModel.countDocuments(query).exec();
    return { items, total };
  }

  async findGrammarTestById(id: string): Promise<GrammarTestDocument> {
    const test = await this.grammarTestModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Grammar test not found');
    }
    return test;
  }

  async updateGrammarTest(
    id: string,
    updateGrammarTestDto: UpdateGrammarTestDto,
  ): Promise<GrammarTestDocument> {
    const test = await this.grammarTestModel
      .findByIdAndUpdate(id, updateGrammarTestDto, { new: true })
      .exec();
    if (!test) {
      throw new NotFoundException('Grammar test not found');
    }
    return test;
  }

  async deleteGrammarTest(id: string): Promise<void> {
    const result = await this.grammarTestModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Grammar test not found');
    }
  }
}
