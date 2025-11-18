import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import { UserDocument, UserStatus } from '../users/schemas/user.schema';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const user = await this.usersService.create(registerDto);
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found or inactive');
      }
      const accessTokenPayload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      const secret = this.configService.get<string>('jwt.secret');
      const expiresIn = this.configService.get<string>('jwt.expiresIn');
      if (!secret || !expiresIn) {
        throw new UnauthorizedException('JWT configuration error');
      }
      const accessToken = this.jwtService.sign(accessTokenPayload, {
        secret,
        expiresIn,
      } as Parameters<typeof this.jwtService.sign>[1]);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: UserDocument): AuthResponse {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const refreshPayload: JwtRefreshPayload = {
      sub: user._id.toString(),
      email: user.email,
      type: 'refresh',
    };
    const secret = this.configService.get<string>('jwt.secret');
    const expiresIn = this.configService.get<string>('jwt.expiresIn');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
    );
    if (!secret || !expiresIn || !refreshSecret || !refreshExpiresIn) {
      throw new UnauthorizedException('JWT configuration error');
    }
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    } as Parameters<typeof this.jwtService.sign>[1]);
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    } as Parameters<typeof this.jwtService.sign>[1]);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
