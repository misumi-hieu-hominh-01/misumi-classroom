import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('daily-review/today')
  async getDailyReviewToday(@CurrentUser() user: CurrentUserPayload) {
    const assignment = await this.assignmentsService.getDailyReview(
      user.userId,
    );
    if (!assignment) {
      return this.assignmentsService.generateDailyReview(user.userId);
    }
    return assignment;
  }

  @Get('daily-review/status')
  async getDailyReviewStatus(@CurrentUser() user: CurrentUserPayload) {
    const assignment = await this.assignmentsService.getDailyReview(
      user.userId,
    );
    if (!assignment) {
      const generated = await this.assignmentsService.generateDailyReview(
        user.userId,
      );
      return {
        pools: generated.pools,
        used: generated.used,
        limits: generated.limits,
        status: generated.status,
      };
    }
    return {
      pools: assignment.pools,
      used: assignment.used,
      limits: assignment.limits,
      status: assignment.status,
    };
  }

  @Get('weekly/current')
  async getWeeklyCurrent(@CurrentUser() user: CurrentUserPayload) {
    const assignment = await this.assignmentsService.getWeekly(user.userId);
    if (!assignment) {
      return this.assignmentsService.generateWeekly(user.userId);
    }
    return assignment;
  }

  @Get('weekly/:period')
  async getWeeklyByPeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Param('period') period: string,
  ) {
    return this.assignmentsService.getWeeklyByPeriod(user.userId, period);
  }

  @Get('weekly/status')
  async getWeeklyStatus(@CurrentUser() user: CurrentUserPayload) {
    const assignment = await this.assignmentsService.getWeekly(user.userId);
    if (!assignment) {
      try {
        const generated = await this.assignmentsService.generateWeekly(
          user.userId,
        );
        return {
          pools: generated.pools,
          used: generated.used,
          limits: generated.limits,
          status: generated.status,
          period: generated.period,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return {
      pools: assignment.pools,
      used: assignment.used,
      limits: assignment.limits,
      status: assignment.status,
      period: assignment.period,
    };
  }

  @Get('monthly/current')
  async getMonthlyCurrent(@CurrentUser() user: CurrentUserPayload) {
    const assignment = await this.assignmentsService.getMonthly(user.userId);
    if (!assignment) {
      return this.assignmentsService.generateMonthly(user.userId);
    }
    return assignment;
  }

  @Get('monthly/:period')
  async getMonthlyByPeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Param('period') period: string,
  ) {
    return this.assignmentsService.getMonthlyByPeriod(user.userId, period);
  }

  @Get('monthly/status')
  async getMonthlyStatus(@CurrentUser() user: CurrentUserPayload) {
    const assignment = await this.assignmentsService.getMonthly(user.userId);
    if (!assignment) {
      try {
        const generated = await this.assignmentsService.generateMonthly(
          user.userId,
        );
        return {
          pools: generated.pools,
          used: generated.used,
          limits: generated.limits,
          status: generated.status,
          period: generated.period,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return {
      pools: assignment.pools,
      used: assignment.used,
      limits: assignment.limits,
      status: assignment.status,
      period: assignment.period,
    };
  }
}
