import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const E1RM_ROLLUP_QUEUE = 'e1rm-rollup';

@Injectable()
@Processor(E1RM_ROLLUP_QUEUE)
export class E1rmRollupWorker {
  constructor(private prisma: PrismaService) {}

  @Process('rollup')
  async handleRollup(job: Job<{ userId: string; workoutId: string }>) {
    const { userId, workoutId } = job.data;

    const sets = await this.prisma.set.findMany({
      where: { workoutId },
      include: { exercise: true },
    });

    const byExercise = new Map<string, typeof sets>();
    for (const set of sets) {
      const existing = byExercise.get(set.exerciseId) ?? [];
      existing.push(set);
      byExercise.set(set.exerciseId, existing);
    }

    for (const [exerciseId, exerciseSets] of byExercise.entries()) {
      const bestSet = exerciseSets.reduce((best, s) =>
        (s.e1rm ?? 0) > (best.e1rm ?? 0) ? s : best,
      );

      const totalVolume = exerciseSets.reduce(
        (sum, s) => sum + s.weight * s.reps, 0,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.performanceHistory.upsert({
        where: {
          userId_exerciseId_date: {
            userId,
            exerciseId,
            date: today,
          },
        },
        update: {
          bestE1rm: bestSet.e1rm ?? 0,
          bestWeight: bestSet.weight,
          bestReps: bestSet.reps,
          totalVolume,
          totalSets: exerciseSets.length,
        },
        create: {
          userId,
          exerciseId,
          workoutId,
          bestE1rm: bestSet.e1rm ?? 0,
          bestWeight: bestSet.weight,
          bestReps: bestSet.reps,
          totalVolume,
          totalSets: exerciseSets.length,
          date: today,
        },
      });
    }
  }
}