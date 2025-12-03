import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserDailyState,
  UserDailyStateDocument,
} from '../attendance/schemas/user-daily-state.schema';
import { getTodayDateKey } from '../common/utils/date.util';
import { ConsumeQuotaDto } from './dto/consume-quota.dto';
import { ConsumeQuotaResponseDto } from './dto/consume-quota-response.dto';

@Injectable()
export class StudyService {
  constructor(
    @InjectModel(UserDailyState.name)
    private dailyStateModel: Model<UserDailyStateDocument>,
  ) {}

  async consumeQuota(
    userId: string,
    consumeDto: ConsumeQuotaDto,
  ): Promise<ConsumeQuotaResponseDto> {
    const dateKey = getTodayDateKey();
    const moduleField = `used.${consumeDto.module}`;
    const limitField = `limits.${consumeDto.module}`;

    // Atomic operation: findOneAndUpdate with condition
    const result = await this.dailyStateModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        dateKey,
        checkedInAt: { $ne: null },
        $expr: {
          $lt: [`$${moduleField}`, `$${limitField}`],
        },
      },
      {
        $inc: { [moduleField]: 1 },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    );

    if (!result) {
      // Check if user hasn't checked in
      const dailyState = await this.dailyStateModel
        .findOne({
          userId: new Types.ObjectId(userId),
          dateKey,
        })
        .exec();

      if (!dailyState || !dailyState.checkedInAt) {
        throw new ForbiddenException('User must check in first');
      }

      // Quota exceeded
      throw new ConflictException('QUOTA_EXCEEDED');
    }

    return {
      used: result.used,
      success: true,
    };
  }

  async getDailyState(userId: string) {
    const dateKey = getTodayDateKey();
    const dailyState = await this.dailyStateModel
      .findOne({
        userId: new Types.ObjectId(userId),
        dateKey,
      })
      .exec();

    if (!dailyState) {
      return null;
    }

    return {
      limits: dailyState.limits,
      used: dailyState.used,
      assigned: {
        vocabIds: dailyState.assigned.vocabIds.map((id) => id.toString()),
        kanjiIds: dailyState.assigned.kanjiIds.map((id) => id.toString()),
        grammarIds: dailyState.assigned.grammarIds.map((id) => id.toString()),
      },
      checkedInAt: dailyState.checkedInAt,
    };
  }
}
