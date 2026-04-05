import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WeeklyFeedbackService {
  constructor(private prisma: PrismaService) {}

  async submit(
    userId: string,
    data: {
      mesocycleId?: string;
      weekNumber: number;
      motivationScore: number;
      fatiguePerception: number;
      performanceFeeling: number;
      energyLevelAvg?: number;
      sleepQualityAvg?: number;
      stressLevelAvg?: number;
      jointPainMap?: Record<string, number>;
      notes?: string;
    },
  ) {
    const jointPainMap = data.jointPainMap
      ? (data.jointPainMap as any)
      : undefined;

    return this.prisma.weeklyFeedback.upsert({
      where: {
        userId_mesocycleId_weekNumber: {
          userId,
          mesocycleId: data.mesocycleId ?? '',
          weekNumber: data.weekNumber,
        },
      },
      update: {
        motivationScore: data.motivationScore,
        fatiguePerception: data.fatiguePerception,
        performanceFeeling: data.performanceFeeling,
        energyLevelAvg: data.energyLevelAvg ?? null,
        sleepQualityAvg: data.sleepQualityAvg ?? null,
        stressLevelAvg: data.stressLevelAvg ?? null,
        jointPainMap,
        notes: data.notes ?? null,
      },
      create: {
        userId,
        mesocycleId: data.mesocycleId ?? null,
        weekNumber: data.weekNumber,
        motivationScore: data.motivationScore,
        fatiguePerception: data.fatiguePerception,
        performanceFeeling: data.performanceFeeling,
        energyLevelAvg: data.energyLevelAvg ?? null,
        sleepQualityAvg: data.sleepQualityAvg ?? null,
        stressLevelAvg: data.stressLevelAvg ?? null,
        jointPainMap,
        notes: data.notes ?? null,
      },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.weeklyFeedback.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 12,
    });
  }

  async getByWeek(userId: string, weekNumber: number) {
    return this.prisma.weeklyFeedback.findFirst({
      where: { userId, weekNumber },
      orderBy: { loggedAt: 'desc' },
    });
  }

  async getSoftSignals(userId: string): Promise<{
    lowMotivationStreak: number;
    highFatigueAndHighSfl: boolean;
  }> {
    const recentTwo = await this.prisma.weeklyFeedback.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 2,
    });

    const lowMotivationStreak = recentTwo.filter(
      (f) => f.motivationScore < 4,
    ).length;

    const highFatigueAndHighSfl =
      recentTwo.length > 0 && recentTwo[0].fatiguePerception > 7;

    return { lowMotivationStreak, highFatigueAndHighSfl };
  }
}