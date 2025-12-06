import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
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
import { UsersService } from '../users/users.service';
import { AdminService } from '../admin/admin.service';
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
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService,
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

    // Get user to check course start date
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.courseStartDate) {
      throw new BadRequestException(
        'Course start date not set. Please contact admin.',
      );
    }

    // Calculate which day this is in the course (starting from day 1)
    const courseStartDate = new Date(user.courseStartDate);
    courseStartDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceCourseStart = Math.floor(
      (today.getTime() - courseStartDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceCourseStart < 0) {
      throw new BadRequestException('Course has not started yet');
    }

    // Get all previous daily states to know which IDs have been used
    const previousStates = await this.dailyStateModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .sort({ dateKey: 1 })
      .exec();

    // Collect all previously assigned IDs
    const usedVocabIds = new Set<string>();
    const usedKanjiIds = new Set<string>();
    const usedGrammarIds = new Set<string>();

    for (const state of previousStates) {
      state.assigned.vocabIds.forEach((id) => usedVocabIds.add(id.toString()));
      state.assigned.kanjiIds.forEach((id) => usedKanjiIds.add(id.toString()));
      state.assigned.grammarIds.forEach((id) =>
        usedGrammarIds.add(id.toString()),
      );
    }

    // Get new items that haven't been assigned yet
    const [allVocab, allKanji, allGrammar] = await Promise.all([
      this.contentService.findAllVocabItems({ limit: 1000, page: 1 }),
      this.contentService.findAllKanjiItems({ limit: 1000, page: 1 }),
      this.contentService.findAllGrammarPoints({ limit: 1000, page: 1 }),
    ]);

    // Filter out already used items
    const availableVocab = allVocab.items.filter(
      (item) => !usedVocabIds.has(item._id.toString()),
    );
    const availableKanji = allKanji.items.filter(
      (item) => !usedKanjiIds.has(item._id.toString()),
    );
    const availableGrammar = allGrammar.items.filter(
      (item) => !usedGrammarIds.has(item._id.toString()),
    );

    // Get limit learning settings from admin
    const limitSettings = await this.adminService.getLimitLearning();
    const vocabLimit = limitSettings.isActive ? limitSettings.limits.vocab : 10;
    const kanjiLimit = limitSettings.isActive ? limitSettings.limits.kanji : 5;
    const grammarLimit = limitSettings.isActive
      ? limitSettings.limits.grammar
      : 1;

    // Assign items based on settings
    const vocabIds = availableVocab
      .slice(0, vocabLimit)
      .map((item) => item._id);
    const kanjiIds = availableKanji
      .slice(0, kanjiLimit)
      .map((item) => item._id);
    const grammarIds = availableGrammar
      .slice(0, grammarLimit)
      .map((item) => item._id);

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
            vocab: vocabLimit,
            kanji: kanjiLimit,
            grammar: grammarLimit,
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

  async getAttendanceHistory(userId: string, month?: string) {
    const query: {
      userId: Types.ObjectId;
      dateKey?: { $gte: string; $lte: string };
    } = {
      userId: new Types.ObjectId(userId),
    };

    // If month is provided (format: YYYY-MM), filter by that month
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = `${year}-${monthNum}-31`;
      query.dateKey = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await this.attendanceModel
      .find(query)
      .sort({ dateKey: 1 })
      .exec();

    return attendanceRecords.map((record) => ({
      dateKey: record.dateKey,
      checkedAt: record.checkedAt,
    }));
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
