import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BodyMetricsService {
  constructor(private prisma: PrismaService) {}

  async logWeight(userId: string, weightKg: number, bodyFatPercent?: number) {
    const recent = await this.prisma.bodyMetricLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 7,
    });

    const avg =
      recent.length > 0
        ? (recent.reduce((sum, r) => sum + r.weightKg, 0) + weightKg) /
          (recent.length + 1)
        : weightKg;

    let trend = 'STABLE';
    if (recent.length >= 3) {
      const oldest = recent[recent.length - 1].weightKg;
      const diff = weightKg - oldest;
      if (diff > 1) trend = 'GAINING';
      else if (diff < -1) trend = 'LOSING';
    }

    return this.prisma.bodyMetricLog.create({
      data: {
        userId,
        weightKg,
        bodyFatPercent: bodyFatPercent ?? null,
        trend,
        rollingAvg7d: Math.round(avg * 10) / 10,
      },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.bodyMetricLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 30,
    });
  }

  async getLatest(userId: string) {
    return this.prisma.bodyMetricLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });
  }

  async getTrend(userId: string) {
    const logs = await this.prisma.bodyMetricLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 7,
    });

    if (logs.length === 0) return { trend: 'STABLE', rollingAvg7d: null };

    return {
      trend: logs[0].trend,
      rollingAvg7d: logs[0].rollingAvg7d,
      latestWeight: logs[0].weightKg,
      loggedAt: logs[0].loggedAt,
    };
  }
}