import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StudyService } from './study.service';
import { ConsumeQuotaDto } from './dto/consume-quota.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('study')
@UseGuards(JwtAuthGuard)
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Post('consume')
  @HttpCode(HttpStatus.OK)
  async consumeQuota(
    @CurrentUser() user: CurrentUserPayload,
    @Body() consumeDto: ConsumeQuotaDto,
  ) {
    return this.studyService.consumeQuota(user.userId, consumeDto);
  }

  @Get('daily-state')
  async getDailyState(@CurrentUser() user: CurrentUserPayload) {
    return this.studyService.getDailyState(user.userId);
  }
}
