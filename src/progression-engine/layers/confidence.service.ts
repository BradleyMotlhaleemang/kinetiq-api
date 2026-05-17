import { Injectable } from '@nestjs/common';
import {
  EXPERIENCE_LEVEL_CONFIG,
  normalizeExperienceLevel,
} from '../constants/experience-level.constants';
import { ConfidenceLevel, ConfidenceResult } from '../models/confidence.model';
import { EngineContext, EnginePhase } from '../models/engine-context.model';
import {
  InterpretationResult,
  PhysiologicalState,
} from '../models/interpretation.model';

@Injectable()
export class ConfidenceService {
  score(
    context: EngineContext,
    interpretation: InterpretationResult,
  ): ConfidenceResult {
    const dataDepth = this.normalizeDepth(context.performanceHistory.length, 10);
    const performanceConsistency = this.performanceConsistency(context);
    const recoveryStability = this.recoveryStability(context);
    const progressionSuccessRate = this.progressionSuccessRate(context);

    const raw =
      dataDepth * 0.3 +
      performanceConsistency * 0.3 +
      recoveryStability * 0.2 +
      progressionSuccessRate * 0.2;

    const boundedScore = Math.max(0, Math.min(100, Math.round(raw * 100)));
    const normalizedExperience = normalizeExperienceLevel(context.experienceLevel);
    const levelConfig = EXPERIENCE_LEVEL_CONFIG[normalizedExperience];
    let progressionAggressiveness = Math.max(
      0,
      Math.min(1, raw * levelConfig.aggressivenessModifier),
    );

    let level = this.levelFromScore(boundedScore);
    if (interpretation.primaryState === PhysiologicalState.INJURY_RISK) {
      level = ConfidenceLevel.LOW_CONFIDENCE;
      progressionAggressiveness = Math.min(progressionAggressiveness, 0.4);
    } else if (interpretation.primaryState === PhysiologicalState.SYSTEMIC_FATIGUE) {
      level = this.capLevel(level, ConfidenceLevel.MODERATE_CONFIDENCE);
      progressionAggressiveness = Math.min(progressionAggressiveness, 0.55);
    } else if (context.enginePhase === EnginePhase.LEARNING) {
      level = this.capLevel(level, ConfidenceLevel.MODERATE_CONFIDENCE);
      progressionAggressiveness = Math.min(progressionAggressiveness, 0.65);
    }

    if (context.performanceHistory.length < 2) {
      level = ConfidenceLevel.INSUFFICIENT_DATA;
      progressionAggressiveness = Math.min(progressionAggressiveness, 0.35);
    }

    return {
      level,
      score: boundedScore,
      factors: {
        performanceConsistency,
        recoveryStability,
        progressionSuccessRate,
        dataDepth,
      },
      progressionAggressiveness,
    };
  }

  private levelFromScore(score: number): ConfidenceLevel {
    if (score >= 80) return ConfidenceLevel.HIGH_CONFIDENCE;
    if (score >= 60) return ConfidenceLevel.MODERATE_CONFIDENCE;
    if (score >= 40) return ConfidenceLevel.LOW_CONFIDENCE;
    return ConfidenceLevel.VERY_LOW_CONFIDENCE;
  }

  private capLevel(current: ConfidenceLevel, cap: ConfidenceLevel): ConfidenceLevel {
    const order: ConfidenceLevel[] = [
      ConfidenceLevel.INSUFFICIENT_DATA,
      ConfidenceLevel.VERY_LOW_CONFIDENCE,
      ConfidenceLevel.LOW_CONFIDENCE,
      ConfidenceLevel.MODERATE_CONFIDENCE,
      ConfidenceLevel.HIGH_CONFIDENCE,
    ];
    return order.indexOf(current) > order.indexOf(cap) ? cap : current;
  }

  private normalizeDepth(value: number, max: number): number {
    return Math.max(0, Math.min(1, value / max));
  }

  private performanceConsistency(context: EngineContext): number {
    const values = context.performanceHistory.slice(0, 3).map((r) => r.bestE1rm);
    if (values.length < 2) return 0.4;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    if (mean <= 0) return 0.4;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const cv = Math.sqrt(variance) / mean;
    return Math.max(0, Math.min(1, 1 - cv));
  }

  private recoveryStability(context: EngineContext): number {
    const snapshots = context.recentProgressionLogs
      .slice(0, 3)
      .map((log) => log.contextSnapshot as { sorenessScore?: number; effortScore?: number });
    if (snapshots.length < 2) return 0.5;
    const values = snapshots.map((s) => (s.sorenessScore ?? 0) + (s.effortScore ?? 0));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    if (mean <= 0) return 0.6;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const normalizedVariance = Math.min(1, variance / 10);
    return Math.max(0, 1 - normalizedVariance);
  }

  private progressionSuccessRate(context: EngineContext): number {
    const attempts = context.recentProgressionLogs.filter((log) =>
      ['PROGRESS', 'PROGRESS_LOAD', 'PROGRESS_REPS'].includes(log.action),
    );
    if (!attempts.length) return 0.5;
    const successful = attempts.filter(
      (log) => (log.repCompletionRate ?? 0) >= 1 || (log.completionRate ?? 0) >= 1,
    );
    return successful.length / attempts.length;
  }
}
