import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthEvent, AuthFailureReason } from './auth-events';
import { AuthLogger } from '../common/logger/auth-logger';

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
}
