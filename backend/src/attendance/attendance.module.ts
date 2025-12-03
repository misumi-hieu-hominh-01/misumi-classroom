import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import {
  UserAttendance,
  UserAttendanceSchema,
} from './schemas/user-attendance.schema';
import {
  UserDailyState,
  UserDailyStateSchema,
} from './schemas/user-daily-state.schema';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAttendance.name, schema: UserAttendanceSchema },
      { name: UserDailyState.name, schema: UserDailyStateSchema },
    ]),
    forwardRef(() => ContentModule),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
