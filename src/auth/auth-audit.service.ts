import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthEvent, AuthFailureReason, AUTH_EVENTS } from './auth-events';
import { AuthLogger } from '../common/logger/auth-logger';

const VERIFICATION_COOLDOWN_MS = 60_000;
const MAX_VERIFICATION_EMAILS_PER_DAY = 5;
const MAX_RESET_EMAILS_PER_DAY = 3;

export type AuditContext = {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthAuditService {
  constructor(
    private prisma: PrismaService,
    private logger: AuthLogger,
  ) {}

  async log(
    event: AuthEvent,
    ctx: AuditContext,
    reason?: AuthFailureReason | string,
  ): Promise<void> {
    await this.prisma.authAuditLog.create({
      data: {
        userId: ctx.userId ?? null,
        email: ctx.email ?? null,
        event,
        reason: reason ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });

    this.logger.logAuthEvent({
      event,
      reason,
      userId: ctx.userId,
      emailHash: ctx.email ? this.hashEmail(ctx.email) : undefined,
      ipAddress: ctx.ipAddress,
    });
  }

  private hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 8);
  }

  async assertVerificationEmailAllowed(userId: string): Promise<void> {
    await this.assertEmailEventAllowed(
      userId,
      AUTH_EVENTS.VERIFICATION_SENT,
      VERIFICATION_COOLDOWN_MS,
      MAX_VERIFICATION_EMAILS_PER_DAY,
    );
  }

  async assertPasswordResetEmailAllowed(userId: string): Promise<void> {
    await this.assertEmailEventAllowed(
      userId,
      AUTH_EVENTS.PASSWORD_RESET_REQUESTED,
      VERIFICATION_COOLDOWN_MS,
      MAX_RESET_EMAILS_PER_DAY,
    );
  }

  private async assertEmailEventAllowed(
    userId: string,
    event: AuthEvent,
    cooldownMs: number,
    maxPerDay: number,
  ): Promise<void> {
    const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [lastSent, dayCount] = await Promise.all([
      this.prisma.authAuditLog.findFirst({
        where: { userId, event },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.authAuditLog.count({
        where: { userId, event, createdAt: { gte: sinceDay } },
      }),
    ]);

    if (lastSent && Date.now() - lastSent.createdAt.getTime() < cooldownMs) {
      throw new HttpException(
        {
          code: 'EMAIL_RATE_LIMIT',
          message: 'Please wait before requesting another email.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (dayCount >= maxPerDay) {
      throw new HttpException(
        {
          code: 'EMAIL_RATE_LIMIT',
          message: 'Daily email limit reached. Try again tomorrow.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
