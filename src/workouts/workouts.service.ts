import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { E1RM_ROLLUP_QUEUE } from '../workers/e1rm-rollup.worker';
import { SFL_DAILY_UPDATE_QUEUE } from '../workers/sfl-daily-update.worker';
import {
  BIOFEEDBACK_PROMPT_QUEUE,
  BIOFEEDBACK_PROMPT_DELAY_2H_MS,
  getMsUntilNextDay11am,
} from '../workers/biofeedback-prompt.worker';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SessionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionEngineService } from '../progression-engine/progression-engine.service';
import { GoalModeService } from '../goal-mode/goal-mode.service';
import { BiofeedbackService } from '../biofeedback/biofeedback.service';
import { VolumeProgressionService } from '../engine/progression/volume-progression.service';
import { SubstitutionEngineService } from '../substitution-engine/substitution-engine.service';
import { resolveJointsForExercise } from '../biofeedback/joint-map';
import { ExerciseActivationService } from './exercise-activation.service';
import { LoadAdvisoryService } from './load-advisory.service';

@Injectable()
export class WorkoutsService {
  constructor(
    private prisma: PrismaService,
    private progressionEngine: ProgressionEngineService,
    private goalMode: GoalModeService,
    private biofeedback: BiofeedbackService,
    private volumeProgression: VolumeProgressionService,
    @InjectQueue(E1RM_ROLLUP_QUEUE) private e1rmQueue: Queue,
    @InjectQueue(SFL_DAILY_UPDATE_QUEUE) private sflQueue: Queue,
    @InjectQueue(BIOFEEDBACK_PROMPT_QUEUE)
    private biofeedbackPromptQueue: Queue,
    private readonly substitutionEngine: SubstitutionEngineService,
    private readonly exerciseActivation: ExerciseActivationService,
    private readonly loadAdvisory: LoadAdvisoryService,
  ) {}

  async create(userId: string, mesocycleId?: string, splitDayLabel?: string) {
    if (mesocycleId) {
      const scheduled = await this.prisma.workout.findFirst({
        where: {
          userId,
          mesocycleId,
          status: 'PLANNED',
          ...(splitDayLabel ? { splitDayLabel } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      if (scheduled) {
        const started = await this.prisma.workout.update({
          where: { id: scheduled.id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            date: new Date(),
          },
        });
        void this.touchUserActivity(userId);
        return started;
      }
    }

    const workout = await this.prisma.workout.create({
      data: {
        userId,
        mesocycleId: mesocycleId ?? null,
        splitDayLabel: splitDayLabel ?? null,
        sessionType: mesocycleId ? SessionType.MESOCYCLE : SessionType.STANDALONE,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        date: new Date(),
      },
    });
    void this.touchUserActivity(userId);
    return workout;
  }

  private async touchUserActivity(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  }

  async findActive(userId: string) {
    return this.prisma.workout.findMany({
      where: {
        userId,
        status: 'IN_PROGRESS',
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: { sets: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id, userId },
      include: {
        sets: true,
        splitTemplate: { select: { goal: true } },
        mesocycle: { include: { splitTemplate: { select: { goal: true } } } },
      },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    return workout;
  }

  async getCompletionAdvisory(
    userId: string,
    excludeWorkoutId?: string,
    completedAfter?: string,
    completedBefore?: string,
  ) {
    const start = completedAfter ? new Date(completedAfter) : new Date();
    const end = completedBefore ? new Date(completedBefore) : new Date();
    if (!completedAfter || !completedBefore) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const completedCount = await this.prisma.workout.count({
      where: {
        userId,
        status: 'COMPLETED',
        ...(excludeWorkoutId ? { id: { not: excludeWorkoutId } } : {}),
        completedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      completedToday: completedCount > 0,
      completedCount,
    };
  }

  async getWorkoutExercises(userId: string, workoutId: string) {
    await this.validateWorkoutOwnership(userId, workoutId);

    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: {
        id: true,
        sessionType: true,
        splitDayLabel: true,
        prescriptionSnapshot: true,
      },
    });
    if (!workout) throw new NotFoundException('Workout not found');

    const rows = await this.prisma.workoutExercise.findMany({
      where: { workoutId },
      include: {
        exercise: {
          select: {
            name: true,
            primaryMuscle: true,
            movementClass: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (rows.length > 0) {
      return {
        workoutId: workout.id,
        sessionType: workout.sessionType,
        splitDayLabel: workout.splitDayLabel,
        exercises: rows.map((row) => ({
          id: row.id,
          exerciseId: row.exerciseId,
          name: row.exercise.name,
          orderIndex: row.orderIndex,
          setsTarget: row.setsTarget,
          repRangeMin: row.repRangeMin,
          repRangeMax: row.repRangeMax,
          primaryMuscle: row.exercise.primaryMuscle,
          movementClass: row.exercise.movementClass ?? 'UNKNOWN',
        })),
      };
    }

    const snapshot = workout.prescriptionSnapshot as {
      exercises?: Array<{
        orderIndex?: number;
        exerciseId?: string | null;
        exerciseName?: string | null;
        primaryMuscle?: string | null;
        setsTarget?: number;
        repRangeMin?: number;
        repRangeMax?: number;
        rpeTarget?: number;
      }>;
    } | null;

    const snapshotEntries = Array.isArray(snapshot?.exercises) ? snapshot.exercises : [];
    if (snapshotEntries.length === 0) {
      return {
        workoutId: workout.id,
        sessionType: workout.sessionType,
        splitDayLabel: workout.splitDayLabel,
        exercises: [],
      };
    }

    const exerciseIds = snapshotEntries
      .map((entry) => entry.exerciseId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const exercisesFromDb = exerciseIds.length > 0
      ? await this.prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
          select: {
            id: true,
            name: true,
            primaryMuscle: true,
            movementClass: true,
          },
        })
      : [];

    const exerciseById = new Map(exercisesFromDb.map((exercise) => [exercise.id, exercise]));

    const exercises = snapshotEntries
      .filter((entry) => entry.exerciseId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((entry, index) => {
        const exerciseId = entry.exerciseId!;
        const meta = exerciseById.get(exerciseId);
        return {
          id: `${workoutId}-${exerciseId}`,
          exerciseId,
          name: meta?.name ?? entry.exerciseName ?? 'Exercise',
          orderIndex: entry.orderIndex ?? index + 1,
          setsTarget: entry.setsTarget ?? 3,
          repRangeMin: entry.repRangeMin ?? 8,
          repRangeMax: entry.repRangeMax ?? 12,
          rpeTarget: entry.rpeTarget ?? null,
          primaryMuscle: meta?.primaryMuscle ?? entry.primaryMuscle ?? null,
          movementClass: meta?.movementClass ?? 'UNKNOWN',
        };
      });

    return {
      workoutId: workout.id,
      sessionType: workout.sessionType,
      splitDayLabel: workout.splitDayLabel,
      exercises,
    };
  }

  async addWorkoutExercise(userId: string, workoutId: string, exerciseId: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: { id: true, status: true, sessionType: true },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Cannot add exercises to a completed workout');
    }
    if (workout.sessionType !== SessionType.STANDALONE) {
      throw new BadRequestException('Exercises can only be added to quick workouts');
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        movementClass: true,
      },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const existing = await this.prisma.workoutExercise.findUnique({
      where: { workoutId_exerciseId: { workoutId, exerciseId } },
    });
    if (existing) {
      return {
        id: existing.id,
        exerciseId: existing.exerciseId,
        name: exercise.name,
        orderIndex: existing.orderIndex,
        setsTarget: existing.setsTarget,
        repRangeMin: existing.repRangeMin,
        repRangeMax: existing.repRangeMax,
        primaryMuscle: exercise.primaryMuscle,
        movementClass: exercise.movementClass ?? 'UNKNOWN',
      };
    }

    const maxOrder = await this.prisma.workoutExercise.aggregate({
      where: { workoutId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? 0) + 1;

    const created = await this.prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId,
        orderIndex,
        setsTarget: 3,
        repRangeMin: 8,
        repRangeMax: 12,
      },
    });

    return {
      id: created.id,
      exerciseId: created.exerciseId,
      name: exercise.name,
      orderIndex: created.orderIndex,
      setsTarget: created.setsTarget,
      repRangeMin: created.repRangeMin,
      repRangeMax: created.repRangeMax,
      primaryMuscle: exercise.primaryMuscle,
      movementClass: exercise.movementClass ?? 'UNKNOWN',
    };
  }

  async removeWorkoutExercise(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
  ) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: { id: true, status: true, sessionType: true },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Cannot remove exercises from a completed workout');
    }
    if (workout.sessionType !== SessionType.STANDALONE) {
      throw new BadRequestException('Exercises can only be removed from quick workouts');
    }

    const row = await this.prisma.workoutExercise.findFirst({
      where: { id: workoutExerciseId, workoutId },
    });
    if (!row) throw new NotFoundException('Workout exercise not found');

    const loggedSets = await this.prisma.set.count({
      where: { workoutId, exerciseId: row.exerciseId },
    });
    if (loggedSets > 0) {
      throw new BadRequestException('Cannot remove an exercise with logged sets');
    }

    await this.prisma.workoutExercise.delete({ where: { id: workoutExerciseId } });
    return { deleted: true };
  }

  private async validateWorkoutOwnership(
    userId: string,
    workoutId: string,
  ): Promise<void> {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: { id: true },
    });
    if (!workout) {
      throw new NotFoundException(`Workout ${workoutId} not found`);
    }
  }

  async findHistory(userId: string) {
    return this.prisma.workout.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sets: {
          include: {
            exercise: { select: { id: true, name: true, primaryMuscle: true } },
          },
        },
      },
    });
  }

  async getPrescription(userId: string, workoutId: string, exerciseId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const goalModeParams = this.goalMode.getParameters(user.goalMode);

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        id: true,
        name: true,
        category: true,
        primaryMuscle: true,
        secondaryMuscles: true,
        movementPattern: true,
      },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: {
        weekNumber: true,
        mesocycleId: true,
        dayNumber: true,
        sessionType: true,
      },
    });

    const lastPerf = await this.prisma.performanceHistory.findFirst({
      where: { userId, exerciseId },
      orderBy: { date: 'desc' },
      select: {
        bestWeight: true,
        bestReps: true,
        totalSets: true,
      },
    });

    if (workout?.sessionType === SessionType.STANDALONE) {
      const weightTarget = lastPerf?.bestWeight ?? 20;
      const repRangeLow = 8;
      const repRangeHigh = 12;
      return {
        exerciseId,
        action: 'HOLD',
        weightTarget,
        repRangeLow,
        repRangeHigh,
        setTarget: 3,
        reason: 'Quick workout — use your last logged performance or defaults.',
        enginePhase: 'BASELINE',
        physiologicalState: 'UNKNOWN',
        confidenceLevel: 'INSUFFICIENT_DATA',
        coachingNote: null,
        progressionStep: null,
        historicalBestWeight: lastPerf?.bestWeight ?? null,
        prescriptionActive: false,
        substitution: {
          action: 'NONE',
          reason: '',
          originalExercise: {
            exerciseId,
            name: exercise.name,
          },
          candidates: [],
        },
      };
    }

    const exerciseSets = await this.prisma.set.findMany({
      where: { workoutId, exerciseId },
      orderBy: { setNumber: 'asc' },
    });
    const lastSet = exerciseSets[exerciseSets.length - 1] ?? null;

    let currentWeight = lastPerf?.bestWeight ?? lastSet?.weight ?? 20;
    let lastRepCount = lastPerf?.bestReps ?? lastSet?.reps ?? 0;
    let lastSetCount = lastPerf?.totalSets ?? exerciseSets.length;

    const recentProgLogs = await this.prisma.progressionLog.findMany({
      where: { userId, exerciseId },
      orderBy: { loggedAt: 'desc' },
      take: 2,
      select: { contextSnapshot: true },
    });
    const priorSnap = recentProgLogs[0]?.contextSnapshot as {
      targetRepRangeLow?: number | null;
      targetRepRangeHigh?: number | null;
    } | null;
    const effortScoreHistory = recentProgLogs.map(
      (l) =>
        (l.contextSnapshot as { effortScore?: number | null } | null)
          ?.effortScore ?? null,
    );
    const targetRepRangeLow =
      priorSnap?.targetRepRangeLow !== undefined &&
      priorSnap?.targetRepRangeLow !== null
        ? priorSnap.targetRepRangeLow
        : null;
    const targetRepRangeHigh =
      priorSnap?.targetRepRangeHigh !== undefined &&
      priorSnap?.targetRepRangeHigh !== null
        ? priorSnap.targetRepRangeHigh
        : null;

    const recentBiofeedback = await this.biofeedback.get48hrOffset(userId);

    const sorenessLog = recentBiofeedback?.sorenessLog as Record<
      string,
      number
    > | null;
    const jointPainLog = recentBiofeedback?.jointComfortLog as Record<
      string,
      number
    > | null;
    const primaryMuscle = exercise.primaryMuscle;
    const sorenessScore = sorenessLog?.[primaryMuscle] ?? 0;

    const normalizeVolumeSignal = (
      raw: number | null | undefined,
    ): number | null => {
      if (raw === null || raw === undefined) return null;
      if (raw === 1) return -1;
      if (raw === -1) return 1;
      return 0;
    };

    let pumpScore: number | null = null;
    let volumeSignal: number | null = null;
    let effortScore: number | null = null;
    let jointPainScore = 0;

    if (recentBiofeedback) {
      effortScore = recentBiofeedback.effortScore ?? null;
      const mgf = recentBiofeedback.muscleGroupFeedback?.find(
        (m) => m.muscleGroup === primaryMuscle,
      );
      pumpScore = recentBiofeedback.pumpScore ?? null;
      volumeSignal = mgf
        ? normalizeVolumeSignal(mgf.volumeSignal)
        : null;
      const fromLog = this.maxJointPainForExercise(
        jointPainLog as Record<string, unknown>,
        exercise.primaryMuscle,
        exercise.secondaryMuscles,
        exercise.movementPattern,
      );
      jointPainScore = Math.max(fromLog, mgf?.jointComfortScore ?? 0);
    }

    const { weekNumber, templateSetCount } =
      await this.resolveMesocycleProgressionContext(
        userId,
        workout?.mesocycleId ?? null,
        workout?.weekNumber ?? null,
        workout?.dayNumber ?? null,
        exerciseId,
      );

    const engineOutput = (await this.progressionEngine.evaluate(
      userId,
      exerciseId,
      exercise.category,
      currentWeight,
      lastRepCount,
      lastSetCount,
      targetRepRangeLow,
      targetRepRangeHigh,
      sorenessScore,
      pumpScore,
      volumeSignal,
      jointPainScore,
      effortScore,
      effortScoreHistory,
      goalModeParams.incrementMultiplier,
      user.goalMode ?? 'MAINTAIN',
      user.experienceLevel ?? 'INTERMEDIATE',
      weekNumber,
      templateSetCount,
    )) as {
      action: string;
      weightTarget: number;
      repRangeLow: number;
      repRangeHigh: number;
      setTarget: number;
      reason: string;
      enginePhase?: string;
      physiologicalState?: string;
      confidence?: string;
      confidenceLevel?: string;
      coachingNote?: string | null;
      progressionStep?: 'REPS' | 'EXECUTION' | 'LOAD' | 'SETS' | null;
    };

    this.queuePendingProgressionLogWrite({
      userId,
      workoutId,
      exerciseId,
      action: engineOutput.action,
      weightTarget: engineOutput.weightTarget,
      prescribedReps: engineOutput.repRangeLow,
      prescribedSets: engineOutput.setTarget,
      physiologicalState: engineOutput.physiologicalState ?? null,
      confidenceLevel:
        engineOutput.confidenceLevel ?? engineOutput.confidence ?? null,
      enginePhase: engineOutput.enginePhase ?? null,
      reason: engineOutput.reason,
      contextSnapshot: {
        workoutId,
        targetRepRangeLow: engineOutput.repRangeLow,
        targetRepRangeHigh: engineOutput.repRangeHigh,
        setTarget: engineOutput.setTarget,
      },
    });

    let setTarget = engineOutput.setTarget;
    let volumeProgressionReason: string | undefined;

    if (exercise.category !== 'ISOLATION_AUXILIARY') {
      const mesocycleRow = workout?.mesocycleId
        ? await this.prisma.mesocycle.findFirst({
            where: { id: workout.mesocycleId, userId },
            select: { volumeTargets: true },
          })
        : null;

      const mrvSetCount = this.resolveMrvSetCountFromMesocycle(
        mesocycleRow?.volumeTargets,
        primaryMuscle,
        templateSetCount,
      );

      const lastThreeBio = await this.prisma.bioFeedback.findMany({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
        take: 3,
        include: {
          muscleGroupFeedback: {
            where: { muscleGroup: primaryMuscle },
          },
        },
      });

      const pad3 = <T>(arr: T[], fill: T): T[] => {
        const out = [...arr];
        while (out.length < 3) out.push(fill);
        return out.slice(0, 3);
      };

      const recentSorenessScores = pad3(
        lastThreeBio.map(
          (r) =>
            (r.sorenessLog as Record<string, number>)?.[primaryMuscle] ?? 0,
        ),
        0,
      );

      const recentPumpScores = pad3(
        lastThreeBio.map((r) => {
          const mg = r.muscleGroupFeedback[0];
          return recentBiofeedback?.pumpScore ?? null;
        }),
        null as number | null,
      );

      const recentVolumeSignals = pad3(
        lastThreeBio.map((r) => {
          const mg = r.muscleGroupFeedback[0];
          return mg ? normalizeVolumeSignal(mg.volumeSignal) : null;
        }),
        null as number | null,
      );

      const sorenessThreshold = this.getSorenessThresholdForVolume(
        user.goalMode ?? 'MAINTAIN',
        user.experienceLevel ?? 'INTERMEDIATE',
      );

      const volResult = await this.volumeProgression.evaluateSetTarget({
        userId,
        exerciseId,
        exerciseCategory: exercise.category,
        currentSetCount: lastSetCount,
        templateSetCount,
        weekNumber,
        mrvSetCount,
        recentVolumeSignals,
        recentPumpScores,
        recentSorenessScores,
        sorenessThreshold,
        jointPainScore,
      });

      setTarget = volResult.setTarget;
      volumeProgressionReason = volResult.reason;
    }

    const jointPainForSubstitution = this.buildJointPainMap(jointPainLog);

    const substitution = await this.substitutionEngine.evaluate(
      userId,
      exerciseId,
      jointPainForSubstitution,
    );

    const activation = await this.exerciseActivation.evaluate(userId, exerciseId);

    const prescription = {
      ...engineOutput,
      confidenceLevel: engineOutput.confidenceLevel ?? null,
      enginePhase: engineOutput.enginePhase ?? null,
      physiologicalState: engineOutput.physiologicalState ?? null,
      coachingNote: engineOutput.coachingNote ?? null,
      progressionStep: engineOutput.progressionStep ?? null,
    };

    return {
      exerciseId,
      ...prescription,
      setTarget,
      prescriptionActive: activation.active,
      activation,
      historicalBestWeight: lastPerf?.bestWeight ?? null,
      ...(volumeProgressionReason !== undefined
        ? { volumeProgressionReason }
        : {}),
      substitution: this.mapSubstitutionForClient(
        substitution,
        exerciseId,
        exercise.name,
        jointPainForSubstitution,
      ),
    };
  }

  private mapSubstitutionForClient(
    sub: Awaited<ReturnType<SubstitutionEngineService['evaluate']>>,
    originalExerciseId: string,
    originalExerciseName: string,
    jointPainLog: Record<string, number>,
  ) {
    const painScores = Object.values(jointPainLog);
    const maxPain = painScores.length > 0 ? Math.max(...painScores) : 0;
    const affectedJoint = Object.entries(jointPainLog).find(
      ([, score]) => score === maxPain,
    )?.[0];

    const base = {
      action: sub.action,
      reason: sub.reason,
      affectedJoint,
      originalExercise: {
        exerciseId: originalExerciseId,
        name: originalExerciseName,
      },
      candidates: sub.candidates?.map((c) => ({
        exerciseId: c.exerciseId,
        name: c.exerciseName,
        priority: c.priority,
      })),
    };

    if (sub.action === 'SUBSTITUTE' && sub.substituteExerciseId) {
      return {
        ...base,
        recommended: {
          exerciseId: sub.substituteExerciseId,
          name: sub.substituteName ?? '',
          reason: sub.reason,
        },
      };
    }

    return base;
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
    await this.validateWorkoutOwnership(userId, workoutId);

    const workout = await this.findOne(userId, workoutId);
    if (workout.status === 'COMPLETED') {
      throw new BadRequestException('Cannot add sets to a completed workout');
    }

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

  if (workout.status === 'COMPLETED') {
    return workout;
  }

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

  void this.touchUserActivity(userId);
  void this.runPostCompleteWork(userId, workoutId, workout.sets);

  return completed;
}

  private runPostCompleteWork(
    userId: string,
    workoutId: string,
    sets: Array<{ exerciseId: string }>,
  ) {
    void (async () => {
      try {
        await this.finalizeWorkoutProgressionLogs(userId, workoutId, sets);
      } catch (err) {
        console.error('[complete] Progression log finalization failed — non-blocking:', err);
      }

      const promptPayload = { userId, workoutId };
      try {
        const jobOpts = { removeOnComplete: 100 as const, removeOnFail: 50 as const };
        await this.e1rmQueue.add('rollup', { userId, workoutId }, {
          ...jobOpts,
          jobId: `rollup:${workoutId}`,
        });
        await this.sflQueue.add('update', { userId, workoutId }, {
          ...jobOpts,
          jobId: `sfl:${workoutId}`,
        });
        await this.biofeedbackPromptQueue.add('prompt', promptPayload, {
          ...jobOpts,
          jobId: `prompt:${workoutId}:immediate`,
        });
        await this.biofeedbackPromptQueue.add('prompt', promptPayload, {
          ...jobOpts,
          jobId: `prompt:${workoutId}:2h`,
          delay: BIOFEEDBACK_PROMPT_DELAY_2H_MS,
        });
        await this.biofeedbackPromptQueue.add('prompt', promptPayload, {
          ...jobOpts,
          jobId: `prompt:${workoutId}:nextday`,
          delay: getMsUntilNextDay11am(),
        });
      } catch (err) {
        console.error('[complete] Queue dispatch failed — non-blocking:', err);
      }
    })();
  }

  private queuePendingProgressionLogWrite(input: {
    userId: string;
    workoutId: string;
    exerciseId: string;
    action: string;
    weightTarget: number;
    prescribedReps: number;
    prescribedSets: number;
    physiologicalState: string | null;
    confidenceLevel: string | null;
    enginePhase: string | null;
    reason: string;
    contextSnapshot: Record<string, unknown>;
  }) {
    void this.upsertPendingProgressionLog(input).catch(() => undefined);
  }

  private async upsertPendingProgressionLog(input: {
    userId: string;
    workoutId: string;
    exerciseId: string;
    action: string;
    weightTarget: number;
    prescribedReps: number;
    prescribedSets: number;
    physiologicalState: string | null;
    confidenceLevel: string | null;
    enginePhase: string | null;
    reason: string;
    contextSnapshot: Record<string, unknown>;
  }) {
    const pendingLogs = await this.prisma.progressionLog.findMany({
      where: {
        userId: input.userId,
        exerciseId: input.exerciseId,
        status: 'PENDING',
      },
      orderBy: { loggedAt: 'desc' },
      take: 10,
    });

    const existing = pendingLogs.find((log) => {
      const snapshot = log.contextSnapshot as { workoutId?: string } | null;
      return snapshot?.workoutId === input.workoutId;
    });

    const data = {
      action: input.action,
      weightTarget: input.weightTarget,
      workoutId: input.workoutId,
      prescribedReps: input.prescribedReps,
      prescribedSets: input.prescribedSets,
      physiologicalState: input.physiologicalState,
      confidenceLevel: input.confidenceLevel,
      enginePhase: input.enginePhase,
      status: 'PENDING' as const,
      reason: input.reason,
      contextSnapshot: input.contextSnapshot as Prisma.InputJsonValue,
    };

    if (existing) {
      await this.prisma.progressionLog.update({
        where: { id: existing.id },
        data,
      });
      return;
    }

    await this.prisma.progressionLog.create({
      data: {
        userId: input.userId,
        exerciseId: input.exerciseId,
        ...data,
      },
    });
  }

  private async finalizeWorkoutProgressionLogs(
    userId: string,
    workoutId: string,
    sets: Array<{ exerciseId: string }>,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];

    await Promise.all(
      exerciseIds.map(async (exerciseId) => {
        const pendingLogs = await this.prisma.progressionLog.findMany({
          where: {
            userId,
            exerciseId,
            status: 'PENDING',
            workoutId: workoutId,
          },
          orderBy: { loggedAt: 'desc' },
          take: 10,
        });

        const pending = pendingLogs[0];

        if (!pending) return;

        const perf = await this.prisma.performanceHistory.findFirst({
          where: {
            userId,
            exerciseId,
            date: { gte: today, lt: tomorrow },
          },
          orderBy: { date: 'desc' },
          select: {
            bestWeight: true,
            bestReps: true,
            totalSets: true,
          },
        });

        if (!perf) {
          await this.prisma.progressionLog.update({
            where: { id: pending.id },
            data: { status: 'SKIPPED' },
          });
          return;
        }

        const prescribedSets = pending.prescribedSets ?? 0;
        const prescribedReps = pending.prescribedReps ?? 0;
        const completionRate =
          prescribedSets > 0 ? perf.totalSets / prescribedSets : null;
        const repCompletionRate =
          prescribedReps > 0 ? perf.bestReps / prescribedReps : null;

        await this.prisma.progressionLog.update({
          where: { id: pending.id },
          data: {
            actualWeight: perf.bestWeight,
            actualReps: perf.bestReps,
            actualSets: perf.totalSets,
            completionRate,
            repCompletionRate,
            status: 'COMPLETED',
          },
        });
      }),
    );
  }

  private toVolumeKeyForMrv(value: string): string {
    const normalized = value.toUpperCase();
    if (normalized.includes('DELT') || normalized.includes('SHOULDER')) {
      return 'SHOULDERS';
    }
    if (normalized.includes('HAMSTRING')) return 'HAMSTRINGS';
    if (normalized.includes('GLUTE')) return 'GLUTES';
    if (normalized.includes('QUAD')) return 'QUADS';
    if (normalized.includes('TRICEP')) return 'TRICEPS';
    if (normalized.includes('BICEP')) return 'BICEPS';
    if (normalized.includes('CALF')) return 'CALVES';
    if (normalized.includes('AB')) return 'ABS';
    if (normalized.includes('CHEST')) return 'CHEST';
    if (normalized.includes('BACK') || normalized.includes('LATS')) return 'BACK';
    return normalized;
  }

  private resolveMrvSetCountFromMesocycle(
    volumeTargets: unknown,
    primaryMuscle: string,
    templateSetCount: number,
  ): number {
    const fallback = templateSetCount + 4;
    const vt = volumeTargets as Record<string, { mrv?: number }> | null;
    if (!vt || typeof vt !== 'object') return fallback;
    const key = this.toVolumeKeyForMrv(primaryMuscle);
    const entry = vt[key];
    const mrv = entry?.mrv;
    if (typeof mrv === 'number' && mrv > 0) return mrv;
    return fallback;
  }

  private getSorenessThresholdForVolume(
    goalMode: string,
    experienceLevel: string,
  ): number {
    const gm = this.normalizeGoalModeForVolume(goalMode);
    const xp = this.normalizeExperienceForVolume(experienceLevel);

    const matrix: Record<
      string,
      Record<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED', number>
    > = {
      STRENGTH: { BEGINNER: 6, INTERMEDIATE: 5, ADVANCED: 4 },
      MUSCLE_GAIN: { BEGINNER: 7, INTERMEDIATE: 6, ADVANCED: 5 },
      MAINTAIN: { BEGINNER: 8, INTERMEDIATE: 7, ADVANCED: 6 },
      WEIGHT_LOSS: { BEGINNER: 8, INTERMEDIATE: 7, ADVANCED: 6 },
    };

    const row = matrix[gm] ?? matrix['MAINTAIN']!;
    return row[xp];
  }

  private normalizeGoalModeForVolume(goalMode: string): string {
    const g = goalMode?.toUpperCase().replace(/[\s-]+/g, '_') || 'MAINTAIN';
    if (g === 'MUSCLE' || g === 'HYPERTROPHY') return 'MUSCLE_GAIN';
    if (
      g === 'STRENGTH' ||
      g === 'MUSCLE_GAIN' ||
      g === 'MAINTAIN' ||
      g === 'WEIGHT_LOSS'
    ) {
      return g;
    }
    return 'MAINTAIN';
  }

  private normalizeExperienceForVolume(
    experienceLevel: string,
  ): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
    const x =
      experienceLevel?.toUpperCase().replace(/[\s-]+/g, '_') || 'INTERMEDIATE';
    if (x === 'BEGINNER' || x === 'NOVICE') return 'BEGINNER';
    if (x === 'ADVANCED') return 'ADVANCED';
    return 'INTERMEDIATE';
  }

  async getLoadAdvisory(
    userId: string,
    workoutId: string,
    exerciseId: string,
    weight: number,
    reps: number,
  ) {
    await this.validateWorkoutOwnership(userId, workoutId);

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, category: true },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const workoutExercise = await this.prisma.workoutExercise.findFirst({
      where: { workoutId, exerciseId },
      select: { repRangeMax: true },
    });

    const sessionSets = await this.prisma.set.findMany({
      where: { workoutId, exerciseId },
      select: { weight: true, reps: true },
      orderBy: { setNumber: 'asc' },
    });

    let confidenceLevel = 'INSUFFICIENT_DATA';
    let weightTarget: number | undefined;
    try {
      const rx = await this.getPrescription(userId, workoutId, exerciseId);
      confidenceLevel = rx.confidenceLevel ?? 'INSUFFICIENT_DATA';
      weightTarget = rx.weightTarget;
    } catch {
      // advisory can still run with defaults
    }

    return this.loadAdvisory.evaluate({
      userId,
      workoutId,
      exerciseId,
      weight,
      reps,
      repRangeHigh: workoutExercise?.repRangeMax,
      weightTarget,
      confidenceLevel,
      sessionSets,
    });
  }

  private jointScoreFromLog(
    jointPainLog: Record<string, unknown>,
    joint: string,
  ): number {
    const v = jointPainLog[joint];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (v && typeof v === 'object' && 'score' in v) {
      const score = (v as { score: unknown }).score;
      if (typeof score === 'number' && !Number.isNaN(score)) return score;
    }
    return 0;
  }

  private maxJointPainForExercise(
    jointPainLog: Record<string, unknown> | null,
    primaryMuscle: string,
    secondaryMuscles: string[],
    movementPattern?: string | null,
  ): number {
    if (!jointPainLog || Object.keys(jointPainLog).length === 0) return 0;

    const relevantJoints = resolveJointsForExercise({
      primaryMuscle,
      secondaryMuscles,
      movementPattern,
    });

    let max = 0;
    for (const joint of relevantJoints) {
      max = Math.max(max, this.jointScoreFromLog(jointPainLog, joint));
    }

    return max;
  }

  private buildJointPainMap(
    jointComfortLog: Record<string, unknown> | null | undefined,
  ): Record<string, number> {
    if (!jointComfortLog || Object.keys(jointComfortLog).length === 0) {
      return {};
    }
    const out: Record<string, number> = {};
    for (const joint of Object.keys(jointComfortLog)) {
      const score = this.jointScoreFromLog(jointComfortLog, joint);
      if (score > 0) out[joint] = score;
    }
    return out;
  }

  private pickSetsTargetFromSplitTemplate(
    splitTemplate: {
      days: Array<{
        dayNumber: number;
        exercises: Array<{ setsTarget: number }>;
      }>;
    } | null,
    workoutDayNumber: number | null,
  ): number | null {
    if (!splitTemplate?.days?.length) return null;

    const collect = (
      days: Array<{
        dayNumber: number;
        exercises: Array<{ setsTarget: number }>;
      }>,
    ) => {
      for (const day of days) {
        const hit = day.exercises[0];
        if (hit) return hit.setsTarget;
      }
      return null;
    };

    if (workoutDayNumber != null) {
      const filtered = splitTemplate.days.filter(
        (d) => d.dayNumber === workoutDayNumber,
      );
      const picked = collect(filtered);
      if (picked != null) return picked;
    }

    return collect(splitTemplate.days);
  }

  private async resolveMesocycleProgressionContext(
    userId: string,
    mesocycleId: string | null,
    workoutWeekNumber: number | null,
    workoutDayNumber: number | null,
    exerciseId: string,
  ): Promise<{ weekNumber: number; templateSetCount: number }> {
    const DEFAULT_SETS = 3;
    let weekNumber = workoutWeekNumber ?? 1;
    let templateSetCount = DEFAULT_SETS;

    if (!mesocycleId) {
      return { weekNumber, templateSetCount };
    }

    const templateWorkout = await this.prisma.workout.findFirst({
      where: {
        userId,
        mesocycleId,
        ...(workoutDayNumber != null ? { dayNumber: workoutDayNumber } : {}),
      },
      orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
      select: {
        prescriptionSnapshot: true,
      },
    });

    const snapshotSetTarget = this.pickSetsTargetFromSnapshot(
      templateWorkout?.prescriptionSnapshot,
      exerciseId,
    );
    if (snapshotSetTarget != null) {
      templateSetCount = snapshotSetTarget;
    }

    const mesocycle = await this.prisma.mesocycle.findFirst({
      where: { id: mesocycleId, userId },
      select: {
        currentWeek: true,
        splitTemplate: {
          select: {
            days: {
              select: {
                dayNumber: true,
                exercises: {
                  where: { exerciseId },
                  select: { setsTarget: true },
                },
              },
            },
          },
        },
      },
    });

    if (!mesocycle) {
      return { weekNumber, templateSetCount };
    }

    if (mesocycle.currentWeek != null) {
      weekNumber = mesocycle.currentWeek;
    }

    const picked = this.pickSetsTargetFromSplitTemplate(
      mesocycle.splitTemplate,
      workoutDayNumber,
    );
    if (picked != null) {
      templateSetCount = picked;
    }

    return { weekNumber, templateSetCount };
  }

  private pickSetsTargetFromSnapshot(
    snapshot: Prisma.JsonValue | null | undefined,
    exerciseId: string,
  ): number | null {
    if (!snapshot || typeof snapshot !== 'object') return null;
    const exercises = (snapshot as { exercises?: unknown }).exercises;
    if (!Array.isArray(exercises)) return null;

    for (const entry of exercises) {
      if (!entry || typeof entry !== 'object') continue;
      const candidate = entry as { exerciseId?: string; setsTarget?: number };
      if (candidate.exerciseId === exerciseId && typeof candidate.setsTarget === 'number') {
        return candidate.setsTarget;
      }
    }
    return null;
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
