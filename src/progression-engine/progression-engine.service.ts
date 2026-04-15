import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ProgressionAction = 'PROGRESS' | 'HOLD' | 'REDUCE' | 'DELOAD';

export interface ProgressionResult {
  action: ProgressionAction;
  weightTarget: number;
  reason: string;
}

@Injectable()
export class ProgressionEngineService {
  constructor(private prisma: PrismaService) {}

  async evaluate(
     userId: string,
  exerciseId: string,
  currentWeight: number,
  sessionReadiness: number,
  sessionMode: string,
  sorenessScore: number,
  goalModeMultiplier: number,
  weeklyFeedbackSignals?: { lowMotivationStreak: number; highFatigueAndHighSfl: boolean },
  muscleGroupFeedback?: { sorenessScore: number; pumpScore: number; volumeSignal: number; jointPainScore: number } | null,
): Promise<ProgressionResult> {
    // ── STEP 1: Readiness override ─────────────────────────────
    if (sessionReadiness < 0.4 || sessionMode === 'DELOAD') {
      const result: ProgressionResult = {
        action: 'DELOAD',
        weightTarget: Math.round(currentWeight * 0.6 * 2) / 2,
        reason: 'Readiness critically low — deload initiated',
      };
      await this.writeLog(userId, exerciseId, result, sessionReadiness, sorenessScore);
      return result;
    }

    // ── STEP 2: Safety override ────────────────────────────────
    if (sorenessScore >= 9) {
      const result: ProgressionResult = {
        action: 'DELOAD',
        weightTarget: Math.round(currentWeight * 0.7 * 2) / 2,
        reason: 'Extreme soreness detected — safety block engaged',
      };
      await this.writeLog(userId, exerciseId, result, sessionReadiness, sorenessScore);
      return result;
    }

    // Step 3 — use muscleGroupFeedback sorenessScore if available
    const effectiveSoreness = muscleGroupFeedback?.sorenessScore ?? sorenessScore;
    if (effectiveSoreness >= 8) {
      const result: ProgressionResult = {
        action: 'HOLD',
        weightTarget: currentWeight,
        reason: `Soreness score ${effectiveSoreness} — still sore, holding load`,
      };
      await this.writeLog(userId, exerciseId, result, sessionReadiness, effectiveSoreness);
      return result;
    }
    if (effectiveSoreness >= 5) {
      const result: ProgressionResult = {
        action: 'HOLD',
        weightTarget: currentWeight,
        reason: `Soreness score ${effectiveSoreness} — healed on time, holding load`,
      };
      await this.writeLog(userId, exerciseId, result, sessionReadiness, effectiveSoreness);
      return result;
    }

    // ── Get last 3 performance history records ─────────────────
    const history = await this.prisma.performanceHistory.findMany({
      where: { userId, exerciseId },
      orderBy: { date: 'desc' },
      take: 3,
    });

    // ── STEP 4: Regression check ───────────────────────────────
    if (history.length >= 2) {
      const latest = history[0];
      const previous = history[1];
      const regressed = latest.bestE1rm < previous.bestE1rm * 0.95;

      if (regressed) {
        const reduced = Math.round(currentWeight * 0.95 * 2) / 2;
        const result: ProgressionResult = {
          action: 'REDUCE',
          weightTarget: reduced,
          reason: 'Performance regression detected — reducing load 5%',
        };
        await this.writeLog(userId, exerciseId, result, sessionReadiness, sorenessScore);
        return result;
      }
    }

    // ── STEP 5: Plateau / inertia check ───────────────────────
    if (history.length >= 3) {
      const [a, b, c] = history;
      const plateau =
        Math.abs(a.bestE1rm - b.bestE1rm) < 1 &&
        Math.abs(b.bestE1rm - c.bestE1rm) < 1;

      if (plateau) {
        await this.prisma.plateauMarker.create({
          data: {
            userId,
            exerciseId,
            reason: 'Same e1rm for 3 consecutive sessions',
          },
        });
        const result: ProgressionResult = {
          action: 'HOLD',
          weightTarget: currentWeight,
          reason: 'Plateau detected — holding load, marker written',
        };
        await this.writeLog(userId, exerciseId, result, sessionReadiness, sorenessScore);
        return result;
      }
    }

    // ── STEP 6: Authorise progression ─────────────────────────
    const volumeModifier = muscleGroupFeedback
      ? muscleGroupFeedback.volumeSignal === 1 ? 1.2
        : muscleGroupFeedback.volumeSignal === -1 ? 0.7
        : muscleGroupFeedback.volumeSignal === 0 && muscleGroupFeedback.pumpScore <= 2 ? 0.9
        : 1.0
      : 1.0;

    const increment = history.length === 0 ? 2.5 : this.calculateIncrement(
      currentWeight,
      goalModeMultiplier,
      sessionReadiness,
    ) * volumeModifier;

    const newWeight = Math.round((currentWeight + increment) * 2) / 2;

    const result: ProgressionResult = {
      action: 'PROGRESS',
      weightTarget: newWeight,
      reason: `All gates passed — progressing by ${increment}kg`,
    };
    await this.writeLog(userId, exerciseId, result, sessionReadiness, sorenessScore);
    await this.checkAndWritePR(userId, exerciseId, currentWeight, newWeight);
    return result;
  }

  private calculateIncrement(
    currentWeight: number,
    goalModeMultiplier: number,
    sessionReadiness: number,
  ): number {
    const base = currentWeight < 40 ? 1.25 : currentWeight < 80 ? 2.5 : 5;
    const adjusted = base * goalModeMultiplier * sessionReadiness;
    return Math.round(adjusted * 4) / 4;
  }

  private async writeLog(
    userId: string,
    exerciseId: string,
    result: ProgressionResult,
    sessionReadiness: number,
    sorenessScore: number,
  ) {
    await this.prisma.progressionLog.create({
      data: {
        userId,
        exerciseId,
        action: result.action,
        weightTarget: result.weightTarget,
        reason: result.reason,
        contextSnapshot: { sessionReadiness, sorenessScore } as any,
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