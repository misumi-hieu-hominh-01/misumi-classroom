import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserAttendanceDocument = UserAttendance & Document;

@Schema({ collection: 'user_attendance', timestamps: true })
export class UserAttendance {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  dateKey: string;

  @Prop({ required: true })
  checkedAt: Date;
}

export const UserAttendanceSchema =
  SchemaFactory.createForClass(UserAttendance);

// Create unique compound index
UserAttendanceSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
