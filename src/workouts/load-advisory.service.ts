import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExerciseActivationService } from './exercise-activation.service';
import { ConfidenceLevel } from '../progression-engine/models/confidence.model';

export type LoadAdvisoryTier = 'NONE' | 'TYPO' | 'PROGRESSION';

export type LoadAdvisoryResult = {
  shouldWarn: boolean;
  tier: LoadAdvisoryTier;
  confidence: string;
  active: boolean;
  isWarmup: boolean;
  baselineWeight: number | null;
  baselineE1RM: number | null;
  message: string;
};

type WorkingSet = { weight: number; reps: number; e1rm: number };

@Injectable()
export class LoadAdvisoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activation: ExerciseActivationService,
  ) {}

  async evaluate(input: {
    userId: string;
    workoutId: string;
    exerciseId: string;
    weight: number;
    reps: number;
    repRangeHigh?: number;
    weightTarget?: number;
    confidenceLevel?: string;
    sessionSets?: Array<{ weight: number; reps: number }>;
  }): Promise<LoadAdvisoryResult> {
    const none = (message: string): LoadAdvisoryResult => ({
      shouldWarn: false,
      tier: 'NONE',
      confidence: input.confidenceLevel ?? 'INSUFFICIENT_DATA',
      active: false,
      isWarmup: false,
      baselineWeight: null,
      baselineE1RM: null,
      message,
    });

    if (!input.weight || input.weight <= 0) {
      return none('No weight entered');
    }

    const activation = await this.activation.evaluate(input.userId, input.exerciseId);
    if (!activation.active) {
      return none('Building your profile for this exercise');
    }

    const confidence = input.confidenceLevel ?? 'INSUFFICIENT_DATA';
    if (
      confidence === ConfidenceLevel.INSUFFICIENT_DATA ||
      confidence === ConfidenceLevel.VERY_LOW_CONFIDENCE
    ) {
      return none('Insufficient history for load advisory');
    }

    const sessionSets = input.sessionSets ?? [];
    const sessionWorkingMax = sessionSets.reduce(
      (max, s) => Math.max(max, s.weight),
      0,
    );

    const isWarmup = this.isWarmupSet({
      weight: input.weight,
      reps: input.reps,
      sessionWorkingMax,
      repRangeHigh: input.repRangeHigh,
      weightTarget: input.weightTarget,
      isFirstSet: sessionSets.length === 0,
    });

    if (isWarmup) {
      return {
        shouldWarn: false,
        tier: 'NONE',
        confidence,
        active: true,
        isWarmup: true,
        baselineWeight: null,
        baselineE1RM: null,
        message: 'Warmup set — no advisory',
      };
    }

    const workingSets = await this.loadWorkingSets(
      input.userId,
      input.exerciseId,
      input.workoutId,
    );

    if (workingSets.length < 3) {
      return none('Not enough working set history');
    }

    const weights = workingSets.map((s) => s.weight).sort((a, b) => a - b);
    const e1rms = workingSets.map((s) => s.e1rm).sort((a, b) => a - b);
    const baselineWeight = this.percentile(weights, 0.85);
    const baselineE1RM = this.median(e1rms);
    const enteredE1RM = input.weight * (1 + input.reps / 30);

    const typoTriggered =
      input.weight >= baselineWeight * 1.8 ||
      input.weight >= baselineWeight * 2.5 ||
      (baselineWeight > 0 && input.weight / baselineWeight >= 5);

    if (typoTriggered) {
      return {
        shouldWarn: true,
        tier: 'TYPO',
        confidence,
        active: true,
        isWarmup: false,
        baselineWeight,
        baselineE1RM,
        message:
          'This looks unusually high compared to your recent working weights. Mistyped?',
      };
    }

    const progressionThreshold = 0.17;
    const progressionTriggered =
      (confidence === ConfidenceLevel.MODERATE_CONFIDENCE ||
        confidence === ConfidenceLevel.HIGH_CONFIDENCE) &&
      enteredE1RM > baselineE1RM * (1 + progressionThreshold);

    if (progressionTriggered) {
      return {
        shouldWarn: true,
        tier: 'PROGRESSION',
        confidence,
        active: true,
        isWarmup: false,
        baselineWeight,
        baselineE1RM,
        message:
          'This is higher than your recent working weights for this exercise. Double-check?',
      };
    }

    return {
      shouldWarn: false,
      tier: 'NONE',
      confidence,
      active: true,
      isWarmup: false,
      baselineWeight,
      baselineE1RM,
      message: 'Within expected range',
    };
  }

  private async loadWorkingSets(
    userId: string,
    exerciseId: string,
    excludeWorkoutId: string,
  ): Promise<WorkingSet[]> {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const sets = await this.prisma.set.findMany({
      where: {
        exerciseId,
        workout: {
          userId,
          status: 'COMPLETED',
          id: { not: excludeWorkoutId },
          completedAt: { gte: since },
        },
      },
      select: { weight: true, reps: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    return sets
      .filter((s) => s.weight > 0 && s.reps > 0)
      .map((s) => ({
        weight: s.weight,
        reps: s.reps,
        e1rm: s.weight * (1 + s.reps / 30),
      }));
  }

  private isWarmupSet(input: {
    weight: number;
    reps: number;
    sessionWorkingMax: number;
    repRangeHigh?: number;
    weightTarget?: number;
    isFirstSet: boolean;
  }): boolean {
    if (
      input.sessionWorkingMax > 0 &&
      input.weight < input.sessionWorkingMax * 0.65
    ) {
      return true;
    }
    if (
      input.repRangeHigh !== undefined &&
      input.reps > input.repRangeHigh + 5
    ) {
      return true;
    }
    if (
      input.isFirstSet &&
      input.weightTarget !== undefined &&
      input.weightTarget > 0 &&
      input.weight < input.weightTarget * 0.7
    ) {
      return true;
    }
    return false;
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(p * sorted.length) - 1),
    );
    return sorted[idx];
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    if (values.length % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    }
    return values[mid];
  }
}
