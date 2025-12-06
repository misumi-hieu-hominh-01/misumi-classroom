import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LimitLearning,
  LimitLearningDocument,
} from './schemas/limit-learning.schema';
import { UpdateLimitLearningDto } from './dto/update-limit-learning.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(LimitLearning.name)
    private limitLearningModel: Model<LimitLearningDocument>,
  ) {}

  async getLimitLearning(): Promise<LimitLearningDocument> {
    let settings = await this.limitLearningModel.findOne().exec();

    // If no settings exist, create default
    if (!settings) {
      settings = new this.limitLearningModel({
        limits: {
          vocab: 10,
          kanji: 5,
          grammar: 1,
        },
        isActive: true,
      });
      await settings.save();
    }

    return settings;
  }

  async updateLimitLearning(
    updateDto: UpdateLimitLearningDto,
  ): Promise<LimitLearningDocument> {
    let settings = await this.limitLearningModel.findOne().exec();

    if (!settings) {
      // Create new if doesn't exist
      settings = new this.limitLearningModel({
        limits: {
          vocab: updateDto.vocab ?? 10,
          kanji: updateDto.kanji ?? 5,
          grammar: updateDto.grammar ?? 1,
        },
        isActive: updateDto.isActive ?? true,
      });
    } else {
      // Update existing
      if (updateDto.vocab !== undefined) {
        settings.limits.vocab = updateDto.vocab;
      }
      if (updateDto.kanji !== undefined) {
        settings.limits.kanji = updateDto.kanji;
      }
      if (updateDto.grammar !== undefined) {
        settings.limits.grammar = updateDto.grammar;
      }
      if (updateDto.isActive !== undefined) {
        settings.isActive = updateDto.isActive;
      }
    }

    settings.updatedAt = new Date();
    return settings.save();
  }
}
