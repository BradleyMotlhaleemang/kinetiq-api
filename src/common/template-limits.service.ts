import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

@Injectable()
export class TemplateLimitsService {
  private readonly maxPerUser = envInt('MAX_CUSTOM_TEMPLATES_PER_USER', 15);
  private readonly perMinute = envInt('CUSTOM_TEMPLATE_CREATE_PER_MINUTE', 3);
  private readonly perDay = envInt('CUSTOM_TEMPLATE_CREATE_PER_DAY', 20);

  constructor(private readonly prisma: PrismaService) {}

  async assertCanCreate(userId: string): Promise<void> {
    const total = await this.prisma.splitTemplate.count({
      where: { userId, isSystem: false },
    });
    if (total >= this.maxPerUser) {
      throw new HttpException(
        {
          code: 'CUSTOM_TEMPLATE_LIMIT_REACHED',
          message: `You can have at most ${this.maxPerUser} custom programs.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentMinute = await this.prisma.splitTemplate.count({
      where: { userId, isSystem: false, createdAt: { gte: oneMinuteAgo } },
    });
    if (recentMinute >= this.perMinute) {
      throw new HttpException(
        {
          code: 'CUSTOM_TEMPLATE_RATE_LIMIT',
          message: 'Too many programs created in the last minute. Please wait and try again.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDay = await this.prisma.splitTemplate.count({
      where: { userId, isSystem: false, createdAt: { gte: oneDayAgo } },
    });
    if (recentDay >= this.perDay) {
      throw new HttpException(
        {
          code: 'CUSTOM_TEMPLATE_RATE_LIMIT',
          message: 'Daily custom program limit reached. Try again tomorrow.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
