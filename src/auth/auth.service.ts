import 'dotenv/config';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';


@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

 async register(email: string, password: string, displayName: string) {
  const existing = await this.users.findByEmail(email);
  if (existing) {
    throw new ConflictException('An account with this email already exists');
  }
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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) return; // silent — prevent enumeration

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.users.setResetToken(user.id, hashedToken, expiry);

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${rawToken}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Kinetiq" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your Kinetiq password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#b1c5ff">Reset your password</h2>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#b1c5ff;color:#002c70;text-decoration:none;font-weight:700;border-radius:4px">
              Reset Password
            </a>
            <p style="color:#8e909c;font-size:12px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Email send failed:', err);
      // Token is stored — user can retry
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.users.findByResetToken(hashedToken);

    if (!user || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      throw new Error('INVALID_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.updatePasswordAndClearToken(user.id, passwordHash);
  }
}