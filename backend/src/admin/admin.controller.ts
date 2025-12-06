import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateLimitLearningDto } from './dto/update-limit-learning.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('limit-learning')
  @Roles(UserRole.ADMIN)
  async getLimitLearning() {
    return this.adminService.getLimitLearning();
  }

  @Put('limit-learning')
  @Roles(UserRole.ADMIN)
  async updateLimitLearning(@Body() updateDto: UpdateLimitLearningDto) {
    return this.adminService.updateLimitLearning(updateDto);
  }
}
