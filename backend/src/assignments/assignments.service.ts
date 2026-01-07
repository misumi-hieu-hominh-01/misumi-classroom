import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserDailyState,
  UserDailyStateDocument,
} from '../attendance/schemas/user-daily-state.schema';
import {
  UserAssignmentDailyReview,
  UserAssignmentDailyReviewDocument,
} from './schemas/user-assignment-daily-review.schema';
import {
  UserAssignmentWeekly,
  UserAssignmentWeeklyDocument,
} from './schemas/user-assignment-weekly.schema';
import {
  UserAssignmentMonthly,
  UserAssignmentMonthlyDocument,
} from './schemas/user-assignment-monthly.schema';
import {
  getCurrentJST,
  getTodayDateKey,
  parseDateKey,
  formatDateKey,
} from '../common/utils/date.util';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(UserDailyState.name)
    private dailyStateModel: Model<UserDailyStateDocument>,
    @InjectModel(UserAssignmentDailyReview.name)
    private dailyReviewModel: Model<UserAssignmentDailyReviewDocument>,
    @InjectModel(UserAssignmentWeekly.name)
    private weeklyModel: Model<UserAssignmentWeeklyDocument>,
    @InjectModel(UserAssignmentMonthly.name)
    private monthlyModel: Model<UserAssignmentMonthlyDocument>,
  ) {}

  /**
   * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) in JST
   */
  private getDayOfWeek(dateKey: string): number {
    const date = parseDateKey(dateKey);
    return date.day();
  }

  /**
   * Check if date is a learning day (Monday-Saturday, T2-T7)
   */
  private isLearningDay(dateKey: string): boolean {
    const dayOfWeek = this.getDayOfWeek(dateKey);
    return dayOfWeek >= 1 && dayOfWeek <= 6;
  }

  /**
   * Get yesterday's dateKey
   */
  private getYesterdayDateKey(dateKey: string): string {
    const date = parseDateKey(dateKey);
    return formatDateKey(date.subtract(1, 'day'));
  }

  /**
   * Get week period (YYYY-W##) for a given date
   */
  private getWeekPeriod(dateKey: string): string {
    const date = parseDateKey(dateKey);
    return date.format('YYYY-[W]WW');
  }

  /**
   * Get month period (YYYY-MM) for a given date
   */
  private getMonthPeriod(dateKey: string): string {
    const date = parseDateKey(dateKey);
    return date.format('YYYY-MM');
  }

  /**
   * Check if current week is week 4 of the month
   * Week 4 is when the Sunday falls in the 4th week of the month
   */
  private isWeek4(dateKey: string): boolean {
    const date = parseDateKey(dateKey);
    const firstDayOfMonth = date.startOf('month');
    const daysDiff = date.diff(firstDayOfMonth, 'day');
    const weekOfMonth = Math.floor(daysDiff / 7) + 1;
    return weekOfMonth >= 4;
  }

  /**
   * Get all dateKeys for a week (Monday-Saturday)
   * Week starts on Monday (day 1) and ends on Saturday (day 6)
   */
  private getWeekDateKeys(dateKey: string): string[] {
    const date = parseDateKey(dateKey);
    let monday =
      date.day() === 0
        ? date.subtract(6, 'day')
        : date.startOf('week').add(1, 'day');
    const dateKeys: string[] = [];

    for (let i = 0; i < 6; i++) {
      dateKeys.push(formatDateKey(monday));
      monday = monday.add(1, 'day');
    }

    return dateKeys;
  }

  /**
   * Get all dateKeys for a month (all learning days T2-T7)
   */
  private getMonthDateKeys(monthPeriod: string): string[] {
    const [year, month] = monthPeriod.split('-').map(Number);
    let current = getCurrentJST()
      .year(year)
      .month(month - 1)
      .date(1);
    const endDate = current.endOf('month');
    const dateKeys: string[] = [];

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      if (this.isLearningDay(formatDateKey(current))) {
        dateKeys.push(formatDateKey(current));
      }
      current = current.add(1, 'day');
    }

    return dateKeys;
  }

  /**
   * Generate daily review assignment from yesterday's learning
   */
  async generateDailyReview(
    userId: string,
    dateKey?: string,
  ): Promise<UserAssignmentDailyReview> {
    const today = dateKey || getTodayDateKey();
    const dayOfWeek = this.getDayOfWeek(today);

    if (dayOfWeek === 1) {
      throw new NotFoundException('No daily review test on Monday');
    }

    const yesterday = this.getYesterdayDateKey(today);
    const yesterdayDayOfWeek = this.getDayOfWeek(yesterday);

    if (yesterdayDayOfWeek === 0) {
      throw new NotFoundException(
        'No daily review test when yesterday was Sunday (no learning day)',
      );
    }

    const existing = await this.dailyReviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        dateKey: today,
      })
      .exec();

    if (existing) {
      return existing;
    }

    const yesterdayState = await this.dailyStateModel
      .findOne({
        userId: new Types.ObjectId(userId),
        dateKey: yesterday,
      })
      .exec();

    if (!yesterdayState || !yesterdayState.checkedInAt) {
      throw new NotFoundException('No learning data from yesterday');
    }

    const pools = {
      vocabIds: yesterdayState.assigned.vocabIds || [],
      kanjiIds: yesterdayState.assigned.kanjiIds || [],
      grammarIds: yesterdayState.assigned.grammarIds || [],
    };

    const limits = {
      vocab: pools.vocabIds.length,
      kanji: pools.kanjiIds.length,
      grammar: pools.grammarIds.length,
    };

    const assignment = new this.dailyReviewModel({
      userId: new Types.ObjectId(userId),
      dateKey: today,
      sourceDateKey: yesterday,
      generatedAt: getCurrentJST().toDate(),
      pools,
      limits,
      used: { vocab: 0, kanji: 0, grammar: 0 },
      status: 'active',
    });

    return assignment.save();
  }

  /**
   * Generate weekly assignment from week's learning (Monday-Saturday)
   */
  async generateWeekly(
    userId: string,
    dateKey?: string,
  ): Promise<UserAssignmentWeekly> {
    const today = dateKey || getTodayDateKey();
    const dayOfWeek = this.getDayOfWeek(today);

    if (dayOfWeek !== 0) {
      throw new NotFoundException('Weekly test is only available on Sunday');
    }

    if (this.isWeek4(today)) {
      throw new NotFoundException(
        'Weekly test not available in week 4. Monthly test is available instead.',
      );
    }

    const period = this.getWeekPeriod(today);
    const existing = await this.weeklyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        period,
      })
      .exec();

    if (existing) {
      return existing;
    }

    const weekDateKeys = this.getWeekDateKeys(today);
    const dailyStates = await this.dailyStateModel
      .find({
        userId: new Types.ObjectId(userId),
        dateKey: { $in: weekDateKeys },
        checkedInAt: { $ne: null },
      })
      .exec();

    const vocabIds = new Set<Types.ObjectId>();
    const kanjiIds = new Set<Types.ObjectId>();
    const grammarIds = new Set<Types.ObjectId>();

    for (const state of dailyStates) {
      state.assigned.vocabIds?.forEach((id) => vocabIds.add(id));
      state.assigned.kanjiIds?.forEach((id) => kanjiIds.add(id));
      state.assigned.grammarIds?.forEach((id) => grammarIds.add(id));
    }

    const pools = {
      vocabIds: Array.from(vocabIds),
      kanjiIds: Array.from(kanjiIds),
      grammarIds: Array.from(grammarIds),
    };

    const limits = {
      vocab: pools.vocabIds.length,
      kanji: pools.kanjiIds.length,
      grammar: pools.grammarIds.length,
    };

    const assignment = new this.weeklyModel({
      userId: new Types.ObjectId(userId),
      period,
      generatedAt: getCurrentJST().toDate(),
      pools,
      limits,
      used: { vocab: 0, kanji: 0, grammar: 0 },
      status: 'active',
    });

    return assignment.save();
  }

  /**
   * Generate monthly assignment from month's learning (all T2-T7 days)
   */
  async generateMonthly(
    userId: string,
    dateKey?: string,
  ): Promise<UserAssignmentMonthly> {
    const today = dateKey || getTodayDateKey();
    const dayOfWeek = this.getDayOfWeek(today);

    if (dayOfWeek !== 0) {
      throw new NotFoundException('Monthly test is only available on Sunday');
    }

    if (!this.isWeek4(today)) {
      throw new NotFoundException(
        'Monthly test is only available on Sunday of week 4',
      );
    }

    const period = this.getMonthPeriod(today);
    const existing = await this.monthlyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        period,
      })
      .exec();

    if (existing) {
      return existing;
    }

    const monthDateKeys = this.getMonthDateKeys(period);
    const dailyStates = await this.dailyStateModel
      .find({
        userId: new Types.ObjectId(userId),
        dateKey: { $in: monthDateKeys },
        checkedInAt: { $ne: null },
      })
      .exec();

    const vocabIds = new Set<Types.ObjectId>();
    const kanjiIds = new Set<Types.ObjectId>();
    const grammarIds = new Set<Types.ObjectId>();

    for (const state of dailyStates) {
      state.assigned.vocabIds?.forEach((id) => vocabIds.add(id));
      state.assigned.kanjiIds?.forEach((id) => kanjiIds.add(id));
      state.assigned.grammarIds?.forEach((id) => grammarIds.add(id));
    }

    const pools = {
      vocabIds: Array.from(vocabIds),
      kanjiIds: Array.from(kanjiIds),
      grammarIds: Array.from(grammarIds),
    };

    const limits = {
      vocab: pools.vocabIds.length,
      kanji: pools.kanjiIds.length,
      grammar: pools.grammarIds.length,
    };

    const assignment = new this.monthlyModel({
      userId: new Types.ObjectId(userId),
      period,
      generatedAt: getCurrentJST().toDate(),
      pools,
      limits,
      used: { vocab: 0, kanji: 0, grammar: 0 },
      status: 'active',
    });

    return assignment.save();
  }

  /**
   * Get daily review assignment for today
   */
  async getDailyReview(
    userId: string,
    dateKey?: string,
  ): Promise<UserAssignmentDailyReview | null> {
    const today = dateKey || getTodayDateKey();
    return this.dailyReviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        dateKey: today,
      })
      .exec();
  }

  /**
   * Get weekly assignment for current week
   */
  async getWeekly(
    userId: string,
    dateKey?: string,
  ): Promise<UserAssignmentWeekly | null> {
    const today = dateKey || getTodayDateKey();
    const period = this.getWeekPeriod(today);
    return this.weeklyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        period,
      })
      .exec();
  }

  /**
   * Get monthly assignment for current month
   */
  async getMonthly(
    userId: string,
    dateKey?: string,
  ): Promise<UserAssignmentMonthly | null> {
    const today = dateKey || getTodayDateKey();
    const period = this.getMonthPeriod(today);
    return this.monthlyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        period,
      })
      .exec();
  }

  /**
   * Get weekly assignment by period
   */
  async getWeeklyByPeriod(
    userId: string,
    period: string,
  ): Promise<UserAssignmentWeekly | null> {
    return this.weeklyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        period,
      })
      .exec();
  }

  /**
   * Get monthly assignment by period
   */
  async getMonthlyByPeriod(
    userId: string,
    period: string,
  ): Promise<UserAssignmentMonthly | null> {
    return this.monthlyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        period,
      })
      .exec();
  }
}
