import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { E1RM_ROLLUP_QUEUE } from '../workers/e1rm-rollup.worker';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionEngineService } from '../progression-engine/progression-engine.service';
import { ReadinessService } from '../readiness/readiness.service';
import { GoalModeService } from '../goal-mode/goal-mode.service';
import { WeeklyFeedbackService } from '../weekly-feedback/weekly-feedback.service';
import { BiofeedbackService } from '../biofeedback/biofeedback.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkoutsService {
  constructor(
    private prisma: PrismaService,
    private progressionEngine: ProgressionEngineService,
    private readiness: ReadinessService,
    private goalMode: GoalModeService,
    private weeklyFeedback: WeeklyFeedbackService,
    private biofeedback: BiofeedbackService,
    private notifications: NotificationsService,
    @InjectQueue(E1RM_ROLLUP_QUEUE) private e1rmQueue: Queue
  ) {}

  async create(userId: string, mesocycleId?: string, splitDayLabel?: string) {
    return this.prisma.workout.create({
      data: {
        userId,
        mesocycleId: mesocycleId ?? null,
        splitDayLabel: splitDayLabel ?? null,
        status: 'IN_PROGRESS',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id, userId },
      include: { sets: true },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    return workout;
  }

  async findHistory(userId: string) {
    return this.prisma.workout.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { sets: true },
    });
  }

  async getPrescription(userId: string, workoutId: string, exerciseId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const todaysReadiness = await this.readiness.getTodaysReadiness(userId);
    const sessionReadiness = todaysReadiness?.sessionReadiness ?? 0.7;
    const sessionMode = todaysReadiness?.sessionMode ?? 'FULL';

    const goalModeParams = this.goalMode.getParameters(user.goalMode);

    const weeklySignals = await this.weeklyFeedback.getSoftSignals(userId);

    const exercise = await this.prisma.exercise.findUnique({
  where: { id: exerciseId },
});

const recentBiofeedback = await this.biofeedback.get48hrOffset(userId);
const sorenessLog = recentBiofeedback?.sorenessLog as Record<string, number> | null;
const primaryMuscle = exercise?.primaryMuscle ?? '';
const sorenessScore = sorenessLog?.[primaryMuscle] ?? 0;

    const lastSet = await this.prisma.set.findFirst({
      where: { workoutId, exerciseId },
      orderBy: { createdAt: 'desc' },
    });
    const currentWeight = lastSet?.weight ?? 20;

    const prescription = await this.progressionEngine.evaluate(
      userId,
      exerciseId,
      currentWeight,
      sessionReadiness,
      sessionMode,
      sorenessScore,
      goalModeParams.incrementMultiplier,
      weeklySignals,
    );

    return {
      exerciseId,
      sessionMode,
      sessionReadiness,
      ...prescription,
    };
  }

  async addSet(
    userId: string,
    workoutId: string,
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
    rpe?: number,
  ) {
    await this.findOne(userId, workoutId);

    const e1rm = weight * (1 + reps / 30);
    const effectiveReps = rpe && rpe >= 7 ? reps * ((rpe - 6) / 4) : reps * 0.5;
    const fatigueCost = weight * 0.01 * (rpe ? rpe / 10 : 0.7);
    const stimulusScore = effectiveReps * (e1rm / 100);

    const set = await this.prisma.set.create({
      data: {
        workoutId,
        exerciseId,
        setNumber,
        weight,
        reps,
        rpe: rpe ?? null,
        e1rm,
        effectiveReps,
        fatigueCost,
        stimulusScore,
      },
    });

    await this.updatePerformanceHistory(userId, exerciseId, workoutId, weight, reps, e1rm);

    return set;
  }

  async updateSet(
    userId: string,
    workoutId: string,
    setId: string,
    weight: number,
    reps: number,
    rpe?: number,
  ) {
    await this.findOne(userId, workoutId);

    const e1rm = weight * (1 + reps / 30);
    const effectiveReps = rpe && rpe >= 7 ? reps * ((rpe - 6) / 4) : reps * 0.5;
    const fatigueCost = weight * 0.01 * (rpe ? rpe / 10 : 0.7);
    const stimulusScore = effectiveReps * (e1rm / 100);

    return this.prisma.set.update({
      where: { id: setId },
      data: { weight, reps, rpe: rpe ?? null, e1rm, effectiveReps, fatigueCost, stimulusScore },
    });
  }

 async complete(userId: string, workoutId: string) {
  const workout = await this.findOne(userId, workoutId);

  const totalVolume = workout.sets.reduce(
    (sum, s) => sum + s.weight * s.reps, 0,
  );
  const totalSets = workout.sets.length;

  const completed = await this.prisma.workout.update({
    where: { id: workoutId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      totalVolume,
      totalSets,
    },
  });

  await this.e1rmQueue.add('rollup', { userId, workoutId });

  await this.notifications.create(userId, 'BIOFEEDBACK_PROMPT', {
    workoutId,
  });

  return completed;
}

  private async updatePerformanceHistory(
    userId: string,
    exerciseId: string,
    workoutId: string,
    weight: number,
    reps: number,
    e1rm: number,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.performanceHistory.findFirst({
      where: { userId, exerciseId, date: { gte: today } },
    });

    if (existing) {
      if (e1rm > existing.bestE1rm) {
        await this.prisma.performanceHistory.update({
          where: { id: existing.id },
          data: {
            bestE1rm: e1rm,
            bestWeight: weight,
            bestReps: reps,
            totalVolume: existing.totalVolume + weight * reps,
            totalSets: existing.totalSets + 1,
          },
        });
      } else {
        await this.prisma.performanceHistory.update({
          where: { id: existing.id },
          data: {
            totalVolume: existing.totalVolume + weight * reps,
            totalSets: existing.totalSets + 1,
          },
        });
      }
    } else {
      await this.prisma.performanceHistory.create({
        data: {
          userId,
          exerciseId,
          workoutId,
          bestE1rm: e1rm,
          bestWeight: weight,
          bestReps: reps,
          totalVolume: weight * reps,
          totalSets: 1,
          date: today,
        },
      });
    }
  }
}
