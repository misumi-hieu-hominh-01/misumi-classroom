import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserRole } from './schemas/user.schema';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Query DB to get latest user info including role
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      roomId: user.roomId,
      courseStartDate: user.courseStartDate,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    const role = req.user?.role;
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view all users');
    }

    const users = await this.usersService.findAll();
    return users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      roomId: user.roomId,
      courseStartDate: user.courseStartDate,
      createdAt: user.createdAt,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const role = req.user?.role;
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update users');
    }

    const user = await this.usersService.update(id, updateUserDto);
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      roomId: user.roomId,
      courseStartDate: user.courseStartDate,
    };
  }
}
