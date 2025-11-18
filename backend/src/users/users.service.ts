import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hash = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      email: createUserDto.email.toLowerCase(),
      hash,
      displayName: createUserDto.displayName,
    });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (updateUserDto.displayName) {
      user.displayName = updateUserDto.displayName;
    }
    return user.save();
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = status;
    return user.save();
  }

  async validatePassword(
    user: UserDocument,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.hash);
  }
}
