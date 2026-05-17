import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { MuscleGroup } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const SFL_DAILY_UPDATE_QUEUE = 'sfl-daily-update';

@Injectable()
@Processor(SFL_DAILY_UPDATE_QUEUE)
export class SflDailyUpdateWorker {
  constructor(private prisma: PrismaService) {}

  @Process('update')
  async handleUpdate(job: Job<{ userId: string; workoutId: string }>) {
    const { userId, workoutId } = job.data;

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const since72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const since7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allSets = await this.prisma.set.findMany({
      where: {
        workout: { userId },
        createdAt: { gte: since7d },
      },
    });

    const sumFatigue = (since: Date) =>
      allSets
        .filter((s) => s.createdAt >= since)
        .reduce((sum, s) => sum + (s.fatigueCost ?? 0), 0);

    const sfl24h = sumFatigue(since24h);
    const sfl48h = sumFatigue(since48h);
    const sfl72h = sumFatigue(since72h);
    const sfl7d  = sumFatigue(since7d);

    const muscleFatigueMap: Record<string, number> = {};
    const sets72h = allSets.filter((s) => s.createdAt >= since72h);
    const uniqueExerciseIds = [...new Set(sets72h.map((s) => s.exerciseId))];
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: uniqueExerciseIds } },
      select: { id: true, primaryMuscle: true },
    });
    const exerciseMap = new Map<string, MuscleGroup>(
      exercises.map((e) => [e.id, e.primaryMuscle]),
    );

    for (const s of sets72h) {
      const primaryMuscle = exerciseMap.get(s.exerciseId);
      if (!primaryMuscle) continue;
      muscleFatigueMap[primaryMuscle] =
        (muscleFatigueMap[primaryMuscle] ?? 0) + (s.fatigueCost ?? 0);
    }

    await this.prisma.fatigueSnapshot.create({
      data: {
        userId,
        sfl24h,
        sfl48h,
        sfl72h,
        sfl7d,
        cnsLoadScore: sfl72h * 0.4,
        metabolicLoadScore: sfl7d * 0.3,
        muscleFatigueMap: muscleFatigueMap as any,
        jointStressMap: {} as any,
      },
    });
  }
}