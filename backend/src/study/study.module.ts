import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';
import {
  UserDailyState,
  UserDailyStateSchema,
} from '../attendance/schemas/user-daily-state.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDailyState.name, schema: UserDailyStateSchema },
    ]),
  ],
  controllers: [StudyController],
  providers: [StudyService],
  exports: [StudyService],
})
export class StudyModule {}
