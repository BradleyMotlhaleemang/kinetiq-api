import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ExerciseActivationResult = {
  active: boolean;
  sessionCount: number;
  workingSetCount: number;
  distinctDays: number;
  performanceHistoryCount: number;
  biofeedbackCycles: number;
};

@Injectable()
export class ExerciseActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseActivationResult> {
    const [completedWorkouts, workingSetCount, perfHistoryCount, biofeedbackCycles] =
      await Promise.all([
        this.prisma.workout.findMany({
          where: {
            userId,
            status: 'COMPLETED',
            sets: { some: { exerciseId } },
          },
          select: { id: true, completedAt: true },
        }),
        this.prisma.set.count({
          where: {
            exerciseId,
            workout: { userId, status: 'COMPLETED' },
          },
        }),
        this.prisma.performanceHistory.count({
          where: { userId, exerciseId },
        }),
        this.prisma.bioFeedback.count({
          where: {
            userId,
            workout: {
              status: 'COMPLETED',
              sets: { some: { exerciseId } },
            },
          },
        }),
      ]);

    const distinctDays = new Set(
      completedWorkouts
        .map((w) => w.completedAt?.toISOString().slice(0, 10))
        .filter(Boolean),
    ).size;

    const sessionCount = completedWorkouts.length;

    const active =
      sessionCount >= 3 &&
      workingSetCount >= 8 &&
      distinctDays >= 2 &&
      perfHistoryCount >= 3 &&
      biofeedbackCycles >= 1;

    return {
      active,
      sessionCount,
      workingSetCount,
      distinctDays,
      performanceHistoryCount: perfHistoryCount,
      biofeedbackCycles,
    };
  }
}
