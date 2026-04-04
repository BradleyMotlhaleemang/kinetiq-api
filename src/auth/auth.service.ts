import 'dotenv/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string, displayName: string) {
    const user = await this.users.create(email, password, displayName);
    return this.signTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.signTokens(user.id, user.email);
  }

  private async signTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}