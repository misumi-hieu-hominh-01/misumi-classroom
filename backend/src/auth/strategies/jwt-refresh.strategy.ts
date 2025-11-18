import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/schemas/user.schema';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  type: 'refresh';
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const refreshSecret = configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new Error('JWT refresh secret must be configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
    });
  }

  async validate(payload: JwtRefreshPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
