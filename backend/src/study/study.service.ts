import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserDailyState,
  UserDailyStateDocument,
} from '../attendance/schemas/user-daily-state.schema';
import { getTodayDateKey } from '../common/utils/date.util';

@Injectable()
export class StudyService {
  constructor(
    @InjectModel(UserDailyState.name)
    private dailyStateModel: Model<UserDailyStateDocument>,
  ) {}

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
