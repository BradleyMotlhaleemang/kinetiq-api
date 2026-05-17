import { Injectable } from '@nestjs/common';
import { ExerciseCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BiofeedbackContext,
  EngineContext,
  EnginePhase,
  ProgressionLogRow,
} from '../models/engine-context.model';
import { normalizeExperienceLevel, EXPERIENCE_LEVEL_CONFIG } from '../constants/experience-level.constants';
import { buildPrescriptionDelta } from '../utils/performance-delta.util';

export interface BuildContextInput {
  userId: string;
  exerciseId: string;
  exerciseCategory: ExerciseCategory;
  currentWeight: number;
  currentRepCount: number;
  currentSetCount: number;
  targetRepRangeLow: number | null;
  targetRepRangeHigh: number | null;
  sorenessScore: number;
  pumpScore: number | null;
  volumeSignal: number | null;
  jointComfortScore: number;
  effortScore: number | null;
  trainingDrive: number | null;
  sessionPerformance: number | null;
  goalMode: string;
  experienceLevel: string;
  weekNumber: number;
  templateSetCount: number;
}

@Injectable()
export class InputAggregatorService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(input: BuildContextInput): Promise<EngineContext> {
    const [user, performanceHistory, recentProgressionLogs, recentBiofeedback] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: input.userId },
          select: { goalMode: true, experienceLevel: true },
        }),
        this.prisma.performanceHistory.findMany({
          where: { userId: input.userId, exerciseId: input.exerciseId },
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            bestE1rm: true,
            bestWeight: true,
            bestReps: true,
            totalSets: true,
            date: true,
          },
        }),
        this.prisma.progressionLog.findMany({
          where: {
            userId: input.userId,
            exerciseId: input.exerciseId,
            status: 'COMPLETED',
          },
          orderBy: { loggedAt: 'desc' },
          take: 5,
          select: {
            action: true,
            loggedAt: true,
            weightTarget: true,
            prescribedWeight: true,
            prescribedReps: true,
            prescribedSets: true,
            actualWeight: true,
            actualReps: true,
            actualSets: true,
            completionRate: true,
            repCompletionRate: true,
            contextSnapshot: true,
          },
        }),
        this.prisma.bioFeedback.findFirst({
          where: {
            userId: input.userId,
            loggedAt: {
              gte: new Date(Date.now() - 72 * 60 * 60 * 1000),
              lte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { loggedAt: 'desc' },
          include: { muscleGroupFeedback: true },
        }),
      ]);

    const goalMode = input.goalMode ?? user?.goalMode ?? 'MAINTAIN';
    const experienceLevel =
      input.experienceLevel ?? user?.experienceLevel ?? 'INTERMEDIATE';
    const normalizedExperience = normalizeExperienceLevel(experienceLevel);
    const sorenessWeight =
      EXPERIENCE_LEVEL_CONFIG[normalizedExperience].sorenessWeight;

    const enginePhase = this.resolveEnginePhase(performanceHistory.length);
    const biofeedback = this.resolveBiofeedbackContext(
      input,
      recentBiofeedback,
      sorenessWeight,
    );

    const mostRecentCompletedLog = recentProgressionLogs[0] as
      | ProgressionLogRow
      | undefined;
    const prescribedWeight =
      mostRecentCompletedLog?.prescribedWeight ??
      mostRecentCompletedLog?.weightTarget ??
      input.currentWeight;
    const prescribedReps =
      mostRecentCompletedLog?.prescribedReps ??
      input.targetRepRangeHigh ??
      input.currentRepCount;
    const prescribedSets =
      mostRecentCompletedLog?.prescribedSets ?? input.templateSetCount;
    const prescriptionDelta =
      enginePhase === EnginePhase.ACTIVE && prescribedWeight > 0
        ? buildPrescriptionDelta({
            prescribedWeight,
            prescribedReps,
            prescribedSets,
            actualWeight: input.currentWeight,
            actualReps: input.currentRepCount,
            actualSets: input.currentSetCount,
          })
        : null;

    return {
      userId: input.userId,
      exerciseId: input.exerciseId,
      exerciseCategory: input.exerciseCategory,
      goalMode,
      experienceLevel,
      enginePhase,
      currentWeight: input.currentWeight,
      currentRepCount: input.currentRepCount,
      currentSetCount: input.currentSetCount,
      weekNumber: input.weekNumber,
      templateSetCount: input.templateSetCount,
      targetRepRangeLow: input.targetRepRangeLow,
      targetRepRangeHigh: input.targetRepRangeHigh,
      prescriptionDelta,
      performanceHistory,
      recentProgressionLogs: recentProgressionLogs as ProgressionLogRow[],
      biofeedback,
      mesocyclePhase: null,
    };
  }

  private resolveEnginePhase(historyCount: number): EnginePhase {
    if (historyCount <= 0) return EnginePhase.BASELINE;
    if (historyCount <= 2) return EnginePhase.CALIBRATING;
    if (historyCount <= 5) return EnginePhase.LEARNING;
    return EnginePhase.ACTIVE;
  }

  private resolveBiofeedbackContext(
    input: BuildContextInput,
    recentBiofeedback: {
      trainingDrive: number;
      sessionPerformance: number;
      pumpScore: number;
      effortScore: number | null;
    } | null,
    sorenessWeight: number,
  ): BiofeedbackContext {
    return {
      sorenessScore: input.sorenessScore * sorenessWeight,
      jointComfortScore: input.jointComfortScore,
      effortScore:
        input.effortScore ??
        recentBiofeedback?.effortScore ??
        2,
      trainingDrive:
        input.trainingDrive ??
        recentBiofeedback?.trainingDrive ??
        3,
      pumpScore:
        input.pumpScore ??
        recentBiofeedback?.pumpScore ??
        3,
      sessionPerformance:
        input.sessionPerformance ??
        recentBiofeedback?.sessionPerformance ??
        3,
      volumeSignal: input.volumeSignal ?? 0,
    };
  }
}
