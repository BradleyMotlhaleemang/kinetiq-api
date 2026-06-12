import 'dotenv/config';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthAuditService, AuditContext } from './auth-audit.service';
import { AUTH_EVENTS, AUTH_FAILURE_REASONS } from './auth-events';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

const REFRESH_COOKIE = 'refreshToken';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const RESET_EXPIRY_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private audit: AuthAuditService,
  ) {}

  async register(
    email: string,
    password: string,
    displayName: string,
    ctx: AuditContext,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.users.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.users.create(normalizedEmail, password, displayName);
    await this.audit.log(AUTH_EVENTS.REGISTRATION, { ...ctx, userId: user.id, email: normalizedEmail });
    await this.sendVerificationEmail(user.id, normalizedEmail, ctx);

    return {
      message: 'Account created. Check your email to verify your account before signing in.',
    };
  }

  async login(email: string, password: string, ctx: AuditContext, res: any) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);

    if (!user) {
      await this.audit.log(AUTH_EVENTS.LOGIN_FAILED, { ...ctx, email: normalizedEmail }, AUTH_FAILURE_REASONS.USER_NOT_FOUND);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.audit.log(
        AUTH_EVENTS.LOGIN_FAILED,
        { ...ctx, userId: user.id, email: normalizedEmail },
        AUTH_FAILURE_REASONS.ACCOUNT_LOCKED,
      );
      throw new UnauthorizedException({
        code: 'ACCOUNT_LOCKED',
        message: 'Account temporarily locked due to too many failed attempts. Try again later.',
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      await this.audit.log(
        AUTH_EVENTS.LOGIN_FAILED,
        { ...ctx, userId: user.id, email: normalizedEmail },
        'ACCOUNT_SUSPENDED',
      );
      throw new UnauthorizedException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account has been suspended. Contact support.',
      });
    }

    if (!user.emailVerified) {
      await this.audit.log(
        AUTH_EVENTS.LOGIN_FAILED,
        { ...ctx, userId: user.id, email: normalizedEmail },
        AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED,
      );
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in.',
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        await this.audit.log(
          AUTH_EVENTS.ACCOUNT_LOCKED,
          { ...ctx, userId: user.id, email: normalizedEmail },
          AUTH_FAILURE_REASONS.BRUTE_FORCE,
        );
      }
      await this.users.recordFailedLogin(user.id, attempts, lockedUntil);
      await this.audit.log(
        AUTH_EVENTS.LOGIN_FAILED,
        { ...ctx, userId: user.id, email: normalizedEmail },
        AUTH_FAILURE_REASONS.INVALID_PASSWORD,
      );
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    await this.users.resetFailedLogin(user.id);
    await this.users.updateLastLogin(user.id);
    const tokens = await this.issueSession(user.id, normalizedEmail, user.role, res);
    await this.audit.log(AUTH_EVENTS.LOGIN_SUCCESS, { ...ctx, userId: user.id, email: normalizedEmail });

    return { accessToken: tokens.accessToken };
  }

  async refresh(req: any, res: any, ctx: AuditContext) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'NO_REFRESH_TOKEN', message: 'Session expired' });
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET as string,
      });
    } catch {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Session expired' });
    }

    const user = await this.users.findByEmail(payload.email);
    if (!user || !user.refreshTokenHash) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Session expired' });
    }

    const presentedHash = this.hashToken(refreshToken);
    if (presentedHash !== user.refreshTokenHash) {
      await this.users.clearRefreshTokenHash(user.id);
      this.clearRefreshCookie(res);
      await this.audit.log(
        AUTH_EVENTS.REFRESH_TOKEN_REUSE,
        { ...ctx, userId: user.id, email: user.email },
      );
      throw new UnauthorizedException({ code: 'TOKEN_REUSE', message: 'Session invalidated' });
    }

    const tokens = await this.issueSession(user.id, user.email, user.role, res);
    return { accessToken: tokens.accessToken };
  }

  async logout(userId: string | undefined, ctx: AuditContext, res: any) {
    if (userId) {
      await this.users.clearRefreshTokenHash(userId);
      await this.audit.log(AUTH_EVENTS.LOGOUT, { ...ctx, userId });
    }
    this.clearRefreshCookie(res);
    return { message: 'Logged out' };
  }

  async verifyEmail(token: string, ctx: AuditContext) {
    const hashedToken = this.hashToken(token);
    const user = await this.users.findByVerificationToken(hashedToken);

    if (!user || !user.emailVerificationTokenExpiry || user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'Verification link is invalid or has expired.',
      });
    }

    if (user.emailVerified) {
      return { message: 'Email already verified. You can sign in.' };
    }

    await this.users.markEmailVerified(user.id);
    await this.audit.log(AUTH_EVENTS.VERIFICATION_COMPLETED, {
      ...ctx,
      userId: user.id,
      email: user.email,
    });

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async resendVerification(email: string, ctx: AuditContext) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);
    if (!user || user.emailVerified) {
      return { message: 'If that email is registered and unverified, a new link will be sent.' };
    }

    try {
      await this.audit.assertVerificationEmailAllowed(user.id);
    } catch {
      return { message: 'If that email is registered and unverified, a new link will be sent.' };
    }

    await this.sendVerificationEmail(user.id, normalizedEmail, ctx);
    return { message: 'If that email is registered and unverified, a new link will be sent.' };
  }

  async forgotPassword(email: string, ctx: AuditContext): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);
    if (!user) return;

    try {
      await this.audit.assertPasswordResetEmailAllowed(user.id);
    } catch {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiry = new Date(Date.now() + RESET_EXPIRY_MS);

    await this.users.setResetToken(user.id, hashedToken, expiry);
    await this.audit.log(AUTH_EVENTS.PASSWORD_RESET_REQUESTED, {
      ...ctx,
      userId: user.id,
      email: normalizedEmail,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${rawToken}`;
    await this.sendEmail(
      normalizedEmail,
      'Reset your Kinetiq password',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#b1c5ff">Reset your password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#b1c5ff;color:#002c70;text-decoration:none;font-weight:700;border-radius:4px">
            Reset Password
          </a>
          <p style="color:#8e909c;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    );
  }

  async resetPassword(token: string, newPassword: string, ctx: AuditContext): Promise<void> {
    const hashedToken = this.hashToken(token);
    const user = await this.users.findByResetToken(hashedToken);

    if (!user || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Reset link is invalid or has expired.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.updatePasswordAndClearToken(user.id, passwordHash);
    await this.audit.log(AUTH_EVENTS.PASSWORD_RESET_COMPLETED, {
      ...ctx,
      userId: user.id,
      email: user.email,
    });
  }

  private async issueSession(
    userId: string,
    email: string,
    role: string,
    res: any,
  ) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: '7d',
    });

    await this.users.setRefreshTokenHash(userId, this.hashToken(refreshToken));
    this.setRefreshCookie(res, refreshToken);

    return { accessToken, refreshToken };
  }

  private async sendVerificationEmail(userId: string, email: string, ctx: AuditContext) {
    await this.audit.assertVerificationEmailAllowed(userId);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiry = new Date(Date.now() + VERIFICATION_EXPIRY_MS);

    await this.users.setVerificationToken(userId, hashedToken, expiry);
    await this.audit.log(AUTH_EVENTS.VERIFICATION_SENT, { ...ctx, userId, email });

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${rawToken}`;
    await this.sendEmail(
      email,
      'Verify your Kinetiq account',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#b1c5ff">Verify your email</h2>
          <p>Thanks for signing up. Click the link below to verify your email address.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#b1c5ff;color:#002c70;text-decoration:none;font-weight:700;border-radius:4px">
            Verify Email
          </a>
          <p style="color:#8e909c;font-size:12px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      `,
    );
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP not configured — email not sent to', to.slice(0, 3) + '***');
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Kinetiq" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private setRefreshCookie(
    res: { cookie: (name: string, value: string, options: object) => void },
    refreshToken: string,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: { clearCookie: (name: string, options: object) => void }) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }
}
