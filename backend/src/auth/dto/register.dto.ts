import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Display name is required' })
  @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
  displayName: string;
}
