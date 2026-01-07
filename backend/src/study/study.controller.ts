import { Controller, Get, UseGuards } from '@nestjs/common';
import { StudyService } from './study.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('study')
@UseGuards(JwtAuthGuard)
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get('daily-state')
  async getDailyState(@CurrentUser() user: CurrentUserPayload) {
    return this.studyService.getDailyState(user.userId);
  }
}
