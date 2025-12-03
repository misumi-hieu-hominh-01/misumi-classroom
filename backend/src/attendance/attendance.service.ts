import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserAttendance,
  UserAttendanceDocument,
} from './schemas/user-attendance.schema';
import {
  UserDailyState,
  UserDailyStateDocument,
} from './schemas/user-daily-state.schema';
import { getTodayDateKey, getCurrentJST } from '../common/utils/date.util';
import { ContentService } from '../content/content.service';
import { CheckInResponseDto } from './dto/check-in-response.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(UserAttendance.name)
    private attendanceModel: Model<UserAttendanceDocument>,
    @InjectModel(UserDailyState.name)
    private dailyStateModel: Model<UserDailyStateDocument>,
    @Inject(forwardRef(() => ContentService))
    private contentService: ContentService,
  ) {}

  async checkIn(userId: string): Promise<CheckInResponseDto> {
    const dateKey = getTodayDateKey();
    const now = getCurrentJST().toDate();

    // Check if already checked in today
    const existingAttendance = await this.attendanceModel
      .findOne({
        userId: new Types.ObjectId(userId),
        dateKey,
      })
      .exec();

    if (existingAttendance) {
      // Return existing daily state
      const dailyState = await this.dailyStateModel
        .findOne({
          userId: new Types.ObjectId(userId),
          dateKey,
        })
        .exec();

      if (dailyState) {
        return this.mapToResponseDto(dailyState);
      }
    }

    // Get assigned items (10 vocab, 5 kanji, 1 grammar) in order
    const [vocabItems, kanjiItems, grammarItems] = await Promise.all([
      this.contentService.findAllVocabItems({ limit: 10, page: 1 }),
      this.contentService.findAllKanjiItems({ limit: 5, page: 1 }),
      this.contentService.findAllGrammarPoints({ limit: 1, page: 1 }),
    ]);

    const vocabIds = vocabItems.items.map((item) => item._id);
    const kanjiIds = kanjiItems.items.map((item) => item._id);
    const grammarIds = grammarItems.items.map((item) => item._id);

    // Upsert attendance
    await this.attendanceModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        dateKey,
      },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          dateKey,
          checkedAt: now,
        },
      },
      { upsert: true, new: true },
    );

    // Upsert daily state with assigned items
    const dailyState = await this.dailyStateModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        dateKey,
      },
      {
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          dateKey,
          limits: {
            vocab: 10,
            kanji: 5,
            grammar: 1,
          },
          used: {
            vocab: 0,
            kanji: 0,
            grammar: 0,
          },
          assigned: {
            vocabIds,
            kanjiIds,
            grammarIds,
          },
          checkedInAt: now,
        },
        $set: {
          updatedAt: now,
        },
      },
      { upsert: true, new: true },
    );

    return this.mapToResponseDto(dailyState);
  }

  async getDailyState(
    userId: string,
    dateKey?: string,
  ): Promise<CheckInResponseDto | null> {
    const targetDateKey = dateKey || getTodayDateKey();
    const dailyState = await this.dailyStateModel
      .findOne({
        userId: new Types.ObjectId(userId),
        dateKey: targetDateKey,
      })
      .exec();

    if (!dailyState) {
      return null;
    }

    return this.mapToResponseDto(dailyState);
  }

  private mapToResponseDto(
    dailyState: UserDailyStateDocument,
  ): CheckInResponseDto {
    // Ensure checkedInAt is always a Date
    const checkedInAt =
      dailyState.checkedInAt || dailyState.updatedAt || new Date();

    return {
      dateKey: dailyState.dateKey,
      limits: dailyState.limits,
      used: dailyState.used,
      assigned: {
        vocabIds: dailyState.assigned.vocabIds.map((id) => id.toString()),
        kanjiIds: dailyState.assigned.kanjiIds.map((id) => id.toString()),
        grammarIds: dailyState.assigned.grammarIds.map((id) => id.toString()),
      },
      checkedInAt,
    };
  }
}
