import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BiofeedbackService {
  constructor(private prisma: PrismaService) {}

  async submit(
    userId: string,
    data: {
      workoutId?: string;
      sorenessLog: Record<string, number>;
      jointPainLog: Record<string, number>;
      energyLevel: number;
      strengthRating: number;
      muscleFeel: number;
      sleepLastNight: number;
      overallWellbeing: number;
    },
  ) {
    return this.prisma.bioFeedback.create({
      data: {
        userId,
        workoutId: data.workoutId ?? null,
        sorenessLog: data.sorenessLog as any,
        jointPainLog: data.jointPainLog as any,
        energyLevel: data.energyLevel,
        strengthRating: data.strengthRating,
        muscleFeel: data.muscleFeel,
        sleepLastNight: data.sleepLastNight,
        overallWellbeing: data.overallWellbeing,
      },
    });
  }

  async getLatest(userId: string) {
    return this.prisma.bioFeedback.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });
  }

  async getSorenessHistory(userId: string, muscle: string) {
    const records = await this.prisma.bioFeedback.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 14,
      select: { sorenessLog: true, loggedAt: true },
    });

    return records.map((r) => ({
      loggedAt: r.loggedAt,
      soreness: (r.sorenessLog as Record<string, number>)[muscle] ?? 0,
    }));
  }

  async get48hrOffset(userId: string) {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.bioFeedback.findFirst({
      where: {
        userId,
        loggedAt: {
          gte: seventyTwoHoursAgo,
          lte: twentyFourHoursAgo,
        },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }
}