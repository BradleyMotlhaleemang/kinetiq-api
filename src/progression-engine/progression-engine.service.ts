import { Injectable } from '@nestjs/common';
import { ExerciseCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ProgressionAction =
  | 'PROGRESS'
  | 'HOLD'
  | 'REDUCE'
  | 'DELOAD'
  | 'VOLUME_PROGRESS';

export interface ProgressionResult {
  action: ProgressionAction;
  weightTarget: number;
  repRangeLow: number;
  repRangeHigh: number;
  setTarget: number;
  reason: string;
}

function roundToPlate(value: number): number {
  if (value < 1) return Math.round(value / 0.25) * 0.25;
  if (value < 2) return Math.round(value / 0.5) * 0.5;
  if (value < 3.75) return Math.round(value / 1.25) * 1.25;
  return Math.round(value / 2.5) * 2.5;
}

function getSessionWeight(index: number): number {
  const weights = [1.0, 0.8, 0.65, 0.5, 0.38, 0.28];
  return index < weights.length ? weights[index]! : 0.2;
}

@Injectable()
export class ProgressionEngineService {
  constructor(private prisma: PrismaService) {}

  async evaluate(
    userId: string,
    exerciseId: string,
    exerciseCategory: ExerciseCategory,
    currentWeight: number,
    lastRepCount: number,
    lastSetCount: number,
    targetRepRangeLow: number | null,
    targetRepRangeHigh: number | null,
    sorenessScore: number,
    pumpScore: number | null,
    volumeSignal: number | null,
    jointPainScore: number,
    effortScore: number | null,
    effortScoreHistory: (number | null)[],
    goalModeMultiplier: number,
    goalMode: string,
    experienceLevel: string,
    weekNumber: number,
    templateSetCount: number,
  ): Promise<ProgressionResult> {
    const repRange = this.getRepRange(exerciseCategory, goalMode);
    const sorenessThreshold = this.getSorenessThreshold(goalMode, experienceLevel);

    const logCtx = {
      sorenessScore,
      pumpScore,
      volumeSignal,
      effortScore,
      exerciseCategory,
      weekNumber,
    };

    const effortHistory = await this.getEffortHistory(
      userId,
      exerciseId,
      effortScore,
      effortScoreHistory,
    );

    // Step 2 — Safety gate (joint pain only)
    if (jointPainScore >= 7) {
      const weightTarget = roundToPlate(currentWeight * 0.85);
      let result: ProgressionResult = {
        action: 'DELOAD',
        weightTarget,
        repRangeLow: repRange.low,
        repRangeHigh: repRange.high,
        setTarget: templateSetCount,
        reason: 'Joint pain elevated — deload for recovery',
      };
      result = this.applyEffortSoftNote(
        result,
        sorenessScore,
        sorenessThreshold,
        pumpScore,
        volumeSignal,
        effortHistory,
      );
      await this.writeLog(userId, exerciseId, result, logCtx, repRange);
      return result;
    }

    // Step 3 — Soreness gate (goal × experience matrix)
    if (sorenessScore >= sorenessThreshold) {
      let result: ProgressionResult = {
        action: 'HOLD',
        weightTarget: currentWeight,
        repRangeLow: repRange.low,
        repRangeHigh: repRange.high,
        setTarget: templateSetCount,
        reason: `Soreness ${sorenessScore} at or above threshold ${sorenessThreshold} — holding load`,
      };
      result = this.applyEffortSoftNote(
        result,
        sorenessScore,
        sorenessThreshold,
        pumpScore,
        volumeSignal,
        effortHistory,
      );
      await this.writeLog(userId, exerciseId, result, logCtx, repRange);
      return result;
    }

    const history = await this.prisma.performanceHistory.findMany({
      where: { userId, exerciseId },
      orderBy: { date: 'desc' },
      take: 20,
    });

    // Step 4 — Weighted history regression check
    if (history.length >= 6) {
      const recentWeighted = this.weightedMeanE1rm(history.slice(0, 3), 0);
      const olderWeighted = this.weightedMeanE1rm(history.slice(3, 6), 3);
      if (recentWeighted < olderWeighted * 0.95) {
        const weightTarget = roundToPlate(currentWeight * 0.95);
        let result: ProgressionResult = {
          action: 'REDUCE',
          weightTarget,
          repRangeLow: repRange.low,
          repRangeHigh: repRange.high,
          setTarget: templateSetCount,
          reason: 'Weighted performance regression vs prior block — reducing load ~5%',
        };
        result = this.applyEffortSoftNote(
          result,
          sorenessScore,
          sorenessThreshold,
          pumpScore,
          volumeSignal,
          effortHistory,
        );
        await this.writeLog(userId, exerciseId, result, logCtx, repRange);
        return result;
      }
    }

    const recentLogs = await this.prisma.progressionLog.findMany({
      where: { userId, exerciseId },
      orderBy: { loggedAt: 'desc' },
      take: 15,
      select: { contextSnapshot: true },
    });

    // Step 5 — Category-aware plateau detection
    const plateauHold = await this.tryPlateauHold({
      exerciseCategory,
      history,
      targetRepRangeHigh,
      volumeSignal,
      lastSetCount,
      templateSetCount,
      userId,
      exerciseId,
      currentWeight,
      repRange,
      recentLogs,
    });
    if (plateauHold) {
      let result = plateauHold;
      result = this.applyEffortSoftNote(
        result,
        sorenessScore,
        sorenessThreshold,
        pumpScore,
        volumeSignal,
        effortHistory,
      );
      await this.writeLog(userId, exerciseId, result, logCtx, repRange);
      return result;
    }

    // Step 6 — Rep performance signal + category-aware increment
    const repSignal = this.getRepSignal(
      lastRepCount,
      targetRepRangeLow,
      targetRepRangeHigh,
    );

    if (
      exerciseCategory === 'ISOLATION_AUXILIARY' &&
      repSignal === 'REP_PROGRESSING' &&
      lastSetCount < templateSetCount + 4
    ) {
      let result: ProgressionResult = {
        action: 'VOLUME_PROGRESS',
        weightTarget: currentWeight,
        repRangeLow: repRange.low,
        repRangeHigh: repRange.high,
        setTarget: lastSetCount + 1,
        reason: 'Accessory isolation progressing in reps — add one set before loading',
      };
      result = this.applyEffortSoftNote(
        result,
        sorenessScore,
        sorenessThreshold,
        pumpScore,
        volumeSignal,
        effortHistory,
      );
      await this.writeLog(userId, exerciseId, result, logCtx, repRange);
      return result;
    }

    const basePct: Record<ExerciseCategory, number> = {
      PRIMARY_COMPOUND: 0.03,
      COMPOUND_ACCESSORY: 0.025,
      ISOLATION_PRIMARY: 0.015,
      ISOLATION_AUXILIARY: 0.0075,
    };

    const repModifier: Record<
      | 'REP_EXCEEDED'
      | 'REP_HIT_CEILING'
      | 'REP_PROGRESSING'
      | 'REP_SHORTFALL'
      | 'NO_TARGET',
      number
    > = {
      REP_EXCEEDED: 1.5,
      REP_HIT_CEILING: 1.0,
      REP_PROGRESSING: 0,
      REP_SHORTFALL: 0,
      NO_TARGET: 1.0,
    };

    const rawIncrement =
      currentWeight *
      basePct[exerciseCategory] *
      repModifier[repSignal] *
      goalModeMultiplier;
    const increment = roundToPlate(rawIncrement);

    if (increment <= 0 || repModifier[repSignal] === 0) {
      let result: ProgressionResult = {
        action: 'HOLD',
        weightTarget: currentWeight,
        repRangeLow: repRange.low,
        repRangeHigh: repRange.high,
        setTarget: templateSetCount,
        reason:
          repSignal === 'REP_PROGRESSING'
            ? 'Reps still progressing in range — holding load'
            : repSignal === 'REP_SHORTFALL'
              ? 'Rep shortfall vs target — holding load after gates'
              : 'No load increase warranted from rep signal — holding',
      };
      result = this.applyEffortSoftNote(
        result,
        sorenessScore,
        sorenessThreshold,
        pumpScore,
        volumeSignal,
        effortHistory,
      );
      await this.writeLog(userId, exerciseId, result, logCtx, repRange);
      return result;
    }

    const newWeight = roundToPlate(currentWeight + increment);
    let result: ProgressionResult = {
      action: 'PROGRESS',
      weightTarget: newWeight,
      repRangeLow: repRange.low,
      repRangeHigh: repRange.high,
      setTarget: templateSetCount,
      reason: `All gates passed — progressing load (~${((increment / currentWeight) * 100).toFixed(1)}% of current weight)`,
    };
    result = this.applyEffortSoftNote(
      result,
      sorenessScore,
      sorenessThreshold,
      pumpScore,
      volumeSignal,
      effortHistory,
    );
    await this.writeLog(userId, exerciseId, result, logCtx, repRange);
    await this.checkAndWritePR(userId, exerciseId, currentWeight, newWeight);
    return result;
  }

  private getSorenessThreshold(goalMode: string, experienceLevel: string): number {
    const gm = this.normalizeGoalMode(goalMode);
    const xp = this.normalizeExperience(experienceLevel);

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

  private normalizeGoalMode(goalMode: string): string {
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

  private normalizeExperience(
    experienceLevel: string,
  ): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
    const x =
      experienceLevel?.toUpperCase().replace(/[\s-]+/g, '_') || 'INTERMEDIATE';
    if (x === 'BEGINNER' || x === 'NOVICE') return 'BEGINNER';
    if (x === 'ADVANCED') return 'ADVANCED';
    return 'INTERMEDIATE';
  }

  private weightedMeanE1rm(
    slice: { bestE1rm: number }[],
    offset = 0,
  ): number {
    let num = 0;
    let den = 0;
    slice.forEach((row, i) => {
      const w = getSessionWeight(offset + i);
      num += w * row.bestE1rm;
      den += w;
    });
    return den > 0 ? num / den : 0;
  }

  private getRepSignal(
    lastRepCount: number,
    targetRepRangeLow: number | null,
    targetRepRangeHigh: number | null,
  ):
    | 'REP_EXCEEDED'
    | 'REP_HIT_CEILING'
    | 'REP_PROGRESSING'
    | 'REP_SHORTFALL'
    | 'NO_TARGET' {
    if (targetRepRangeLow === null || targetRepRangeHigh === null) {
      return 'NO_TARGET';
    }
    if (lastRepCount >= targetRepRangeHigh + 3) return 'REP_EXCEEDED';
    if (lastRepCount >= targetRepRangeHigh - 1) return 'REP_HIT_CEILING';
    if (lastRepCount >= targetRepRangeLow) return 'REP_PROGRESSING';
    return 'REP_SHORTFALL';
  }

  private getRepRange(
    category: ExerciseCategory,
    goalMode: string,
  ): { low: number; high: number } {
    const gm = this.normalizeGoalMode(goalMode);

    const table: Record<
      string,
      Record<ExerciseCategory, { low: number; high: number }>
    > = {
      STRENGTH: {
        PRIMARY_COMPOUND: { low: 3, high: 5 },
        COMPOUND_ACCESSORY: { low: 4, high: 6 },
        ISOLATION_PRIMARY: { low: 6, high: 8 },
        ISOLATION_AUXILIARY: { low: 8, high: 10 },
      },
      MUSCLE_GAIN: {
        PRIMARY_COMPOUND: { low: 6, high: 10 },
        COMPOUND_ACCESSORY: { low: 8, high: 12 },
        ISOLATION_PRIMARY: { low: 10, high: 15 },
        ISOLATION_AUXILIARY: { low: 12, high: 15 },
      },
      MAINTAIN: {
        PRIMARY_COMPOUND: { low: 8, high: 12 },
        COMPOUND_ACCESSORY: { low: 10, high: 15 },
        ISOLATION_PRIMARY: { low: 12, high: 15 },
        ISOLATION_AUXILIARY: { low: 15, high: 20 },
      },
      WEIGHT_LOSS: {
        PRIMARY_COMPOUND: { low: 10, high: 15 },
        COMPOUND_ACCESSORY: { low: 12, high: 15 },
        ISOLATION_PRIMARY: { low: 15, high: 20 },
        ISOLATION_AUXILIARY: { low: 15, high: 20 },
      },
    };

    const row = table[gm] ?? table['MAINTAIN']!;
    return row[category];
  }

  private async getEffortHistory(
    userId: string,
    exerciseId: string,
    currentEffort: number | null,
    prefetchedRecentLogEfforts: (number | null)[],
  ): Promise<(number | null)[]> {
    const logs = await this.prisma.progressionLog.findMany({
      where: { userId, exerciseId },
      orderBy: { loggedAt: 'desc' },
      take: 8,
      select: { contextSnapshot: true },
    });
    const fromLogs = logs.map(
      (l) =>
        (l.contextSnapshot as { effortScore?: number | null } | null)
          ?.effortScore ?? null,
    );
    const skip = prefetchedRecentLogEfforts.length;
    const tail = fromLogs.slice(skip);
    return [currentEffort, ...prefetchedRecentLogEfforts, ...tail];
  }

  private isLowEffortStreak(effortHistory: (number | null)[]): boolean {
    const last2 = effortHistory.slice(0, 2);
    return (
      last2.length === 2 &&
      last2.every((e) => e !== null && e !== undefined && e <= 2)
    );
  }

  private applyEffortSoftNote(
    result: ProgressionResult,
    sorenessScore: number,
    sorenessThreshold: number,
    pumpScore: number | null,
    volumeSignal: number | null,
    effortHistory: (number | null)[],
  ): ProgressionResult {
    if (!this.isLowEffortStreak(effortHistory)) return result;

    let negatives = 0;
    if (sorenessThreshold > 0 && sorenessScore >= sorenessThreshold * 0.6) {
      negatives++;
    }
    if (pumpScore !== null && pumpScore <= 2) negatives++;
    if (volumeSignal === 1) negatives++;

    if (negatives >= 2) {
      return {
        ...result,
        reason:
          result.reason +
          ' Note: consecutive low-effort ratings with multiple fatigue signals — monitor recovery.',
      };
    }
    return result;
  }

  private async tryPlateauHold(params: {
    exerciseCategory: ExerciseCategory;
    history: { bestE1rm: number; bestReps: number; bestWeight: number }[];
    targetRepRangeHigh: number | null;
    volumeSignal: number | null;
    lastSetCount: number;
    templateSetCount: number;
    userId: string;
    exerciseId: string;
    currentWeight: number;
    repRange: { low: number; high: number };
    recentLogs: { contextSnapshot: unknown }[];
  }): Promise<ProgressionResult | null> {
    const {
      exerciseCategory,
      history,
      targetRepRangeHigh,
      volumeSignal,
      lastSetCount,
      templateSetCount,
      userId,
      exerciseId,
      currentWeight,
      repRange,
      recentLogs,
    } = params;

    if (exerciseCategory === 'PRIMARY_COMPOUND' && history.length >= 5) {
      const slice = history.slice(0, 5);
      const e1rms = slice.map((h) => h.bestE1rm);
      const wMean = this.weightedMeanE1rm(slice, 0);
      const spread = Math.max(...e1rms) - Math.min(...e1rms);
      if (wMean > 0 && spread / wMean < 0.01) {
        await this.prisma.plateauMarker.create({
          data: {
            userId,
            exerciseId,
            reason:
              'Compound primary e1rm flat (<1% across 5 weighted sessions) — consider pause reps or tempo change',
          },
        });
        return {
          action: 'HOLD',
          weightTarget: currentWeight,
          repRangeLow: repRange.low,
          repRangeHigh: repRange.high,
          setTarget: templateSetCount,
          reason:
            'Plateau on primary compound — try a technique variation (pause rep or tempo)',
        };
      }
      return null;
    }

    if (exerciseCategory === 'COMPOUND_ACCESSORY' && history.length >= 3) {
      if (targetRepRangeHigh === null) return null;

      const slice = history.slice(0, 3);
      const e1rms = slice.map((h) => h.bestE1rm);
      const meanE = e1rms.reduce((a, b) => a + b, 0) / e1rms.length;
      const spreadE = Math.max(...e1rms) - Math.min(...e1rms);
      const eStall = meanE > 0 && spreadE / meanE < 0.01;

      const repsProgressing =
        targetRepRangeHigh !== null &&
        (slice[0]!.bestReps > slice[2]!.bestReps ||
          slice[0]!.bestReps >= targetRepRangeHigh - 1);

      if (repsProgressing) return null;

      if (eStall) {
        await this.prisma.plateauMarker.create({
          data: {
            userId,
            exerciseId,
            reason:
              'Accessory compound e1rm and reps stalled — review execution or weak links',
          },
        });
        return {
          action: 'HOLD',
          weightTarget: currentWeight,
          repRangeLow: repRange.low,
          repRangeHigh: repRange.high,
          setTarget: templateSetCount,
          reason:
            'Accessory plateau — load and reps stalled; marker recorded',
        };
      }
      return null;
    }

    if (exerciseCategory === 'ISOLATION_AUXILIARY') {
      const fromLogs = recentLogs.map((log) => {
        const snap = log.contextSnapshot as {
          volumeSignal?: number | null;
        } | null;
        return snap?.volumeSignal ?? null;
      });
      const signals = [volumeSignal, ...fromLogs];
      let consecutiveTooLittle = 0;
      for (const s of signals) {
        if (s === -1) consecutiveTooLittle++;
        else break;
      }

      if (
        consecutiveTooLittle >= 3 &&
        lastSetCount >= templateSetCount + 3
      ) {
        await this.prisma.plateauMarker.create({
          data: {
            userId,
            exerciseId,
            reason:
              'Persistent low volume signal at high set counts — consider exercise substitution',
          },
        });
        return {
          action: 'HOLD',
          weightTarget: currentWeight,
          repRangeLow: repRange.low,
          repRangeHigh: repRange.high,
          setTarget: templateSetCount,
          reason:
            'Accessory isolation volume chronically low near set cap — consider a substitution',
        };
      }
    }

    return null;
  }

  private async writeLog(
    userId: string,
    exerciseId: string,
    result: ProgressionResult,
    ctx: {
      sorenessScore: number;
      pumpScore: number | null;
      volumeSignal: number | null;
      effortScore: number | null;
      exerciseCategory: ExerciseCategory;
      weekNumber: number;
    },
    repRange: { low: number; high: number },
  ) {
    await this.prisma.progressionLog.create({
      data: {
        userId,
        exerciseId,
        action: result.action,
        weightTarget: result.weightTarget,
        reason: result.reason,
        contextSnapshot: {
          sorenessScore: ctx.sorenessScore,
          pumpScore: ctx.pumpScore,
          volumeSignal: ctx.volumeSignal,
          effortScore: ctx.effortScore,
          exerciseCategory: ctx.exerciseCategory,
          weekNumber: ctx.weekNumber,
          targetRepRangeLow: repRange.low,
          targetRepRangeHigh: repRange.high,
          setTarget: result.setTarget,
        } as any,
      },
    });
  }

  private async checkAndWritePR(
    userId: string,
    exerciseId: string,
    currentWeight: number,
    proposedWeight: number,
  ) {
    const bestRecord = await this.prisma.pRRecord.findFirst({
      where: { userId, exerciseId, prType: 'WEIGHT' },
      orderBy: { value: 'desc' },
    });

    if (!bestRecord || proposedWeight > bestRecord.value) {
      const latestWorkout = await this.prisma.workout.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
      });

      if (latestWorkout) {
        await this.prisma.pRRecord.create({
          data: {
            userId,
            exerciseId,
            prType: 'WEIGHT',
            value: proposedWeight,
            workoutId: latestWorkout.id,
          },
        });
      }
    }
  }
}
