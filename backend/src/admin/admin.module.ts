import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  LimitLearning,
  LimitLearningSchema,
} from './schemas/limit-learning.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LimitLearning.name, schema: LimitLearningSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
