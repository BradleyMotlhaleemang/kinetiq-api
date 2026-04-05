import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NUTRITION_INTEGRATION_ENABLED = true;

@Injectable()
export class ReadinessService {
  constructor(private prisma: PrismaService) {}

  async checkIn(
    userId: string,
    sleepScore: number,
    stressScore: number,
    nutritionScore: number,
    motivationScore: number,
    muscleReadinessScore: number,
    workoutId?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.sessionReadiness.findFirst({
      where: { userId, createdAt: { gte: today } },
    });

    if (existing) {
      throw new ConflictException(
        'Readiness check-in already submitted today',
      );
    }

    let resolvedNutritionScore = nutritionScore;

    if (NUTRITION_INTEGRATION_ENABLED) {
      const autoScore = await this.getAutoNutritionScore(userId);
      if (autoScore !== null) {
        resolvedNutritionScore = autoScore;
      }
    }

    const rawReadiness =
      (sleepScore +
        stressScore +
        resolvedNutritionScore +
        motivationScore +
        muscleReadinessScore) /
      25;

    const sessionReadiness = Math.min(Math.max(rawReadiness, 0), 1);

    let sessionMode: string;
    if (sessionReadiness >= 0.75) sessionMode = 'FULL';
    else if (sessionReadiness >= 0.5) sessionMode = 'MODIFIED';
    else sessionMode = 'DELOAD';

    return this.prisma.sessionReadiness.create({
      data: {
        userId,
        workoutId: workoutId ?? null,
        sleepScore,
        stressScore,
        nutritionScore: resolvedNutritionScore,
        motivationScore,
        muscleReadinessScore,
        sessionReadiness,
        sessionMode,
      },
    });
  }

  async getLatest(userId: string) {
    return this.prisma.sessionReadiness.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.sessionReadiness.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getTodaysReadiness(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.sessionReadiness.findFirst({
      where: { userId, createdAt: { gte: today } },
    });
  }

  private async getAutoNutritionScore(userId: string): Promise<number | null> {
    const target = await this.prisma.nutritionTarget.findUnique({
      where: { userId },
    });

    if (!target) return null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const logs = await this.prisma.foodLog.findMany({
      where: { userId, date: { gte: yesterday, lte: yesterdayEnd } },
    });

    if (logs.length === 0) return null;

    const totalProtein = logs.reduce((sum, l) => sum + l.proteinConsumed, 0);
    const totalCalories = logs.reduce((sum, l) => sum + l.caloriesConsumed, 0);

    const proteinPct = totalProtein / target.proteinTarget;
    const calorieDelta = totalCalories - target.caloriesTarget;

    let score: number;
    if (proteinPct >= 0.85 && calorieDelta > -500) score = 4;
    else if (proteinPct >= 0.6) score = 3;
    else score = 2;

    if (calorieDelta < -500) score = Math.min(score, 3);

    return score;
  }
}