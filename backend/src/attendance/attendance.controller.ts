import {
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(@CurrentUser() user: CurrentUserPayload) {
    return this.attendanceService.checkIn(user.userId);
  }

  @Get('status')
  async getStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dateKey') dateKey?: string,
  ) {
    return this.attendanceService.getDailyState(user.userId, dateKey);
  }
}
