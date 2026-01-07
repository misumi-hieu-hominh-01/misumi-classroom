import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import {
  UserDailyState,
  UserDailyStateSchema,
} from '../attendance/schemas/user-daily-state.schema';
import {
  UserAssignmentDailyReview,
  UserAssignmentDailyReviewSchema,
} from './schemas/user-assignment-daily-review.schema';
import {
  UserAssignmentWeekly,
  UserAssignmentWeeklySchema,
} from './schemas/user-assignment-weekly.schema';
import {
  UserAssignmentMonthly,
  UserAssignmentMonthlySchema,
} from './schemas/user-assignment-monthly.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDailyState.name, schema: UserDailyStateSchema },
      {
        name: UserAssignmentDailyReview.name,
        schema: UserAssignmentDailyReviewSchema,
      },
      { name: UserAssignmentWeekly.name, schema: UserAssignmentWeeklySchema },
      { name: UserAssignmentMonthly.name, schema: UserAssignmentMonthlySchema },
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
