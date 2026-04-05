import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Readiness check-in already submitted today',
      );
    }

    const rawReadiness =
      (sleepScore + stressScore + nutritionScore + motivationScore + muscleReadinessScore) / 25;

    const sessionReadiness = Math.min(Math.max(rawReadiness, 0), 1);

    let sessionMode: string;
    if (sessionReadiness >= 0.75) {
      sessionMode = 'FULL';
    } else if (sessionReadiness >= 0.5) {
      sessionMode = 'MODIFIED';
    } else {
      sessionMode = 'DELOAD';
    }

    return this.prisma.sessionReadiness.create({
      data: {
        userId,
        workoutId: workoutId ?? null,
        sleepScore,
        stressScore,
        nutritionScore,
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
      where: {
        userId,
        createdAt: { gte: today },
      },
    });
  }
}