import { Injectable } from '@nestjs/common';
import {
  EXPERIENCE_LEVEL_CONFIG,
  normalizeExperienceLevel,
} from '../constants/experience-level.constants';
import {
  BASE_INCREMENT,
  GOAL_MODE_REP_RANGES,
  normalizeGoalMode,
} from '../constants/goal-mode.constants';
import { ConfidenceResult } from '../models/confidence.model';
import { EngineContext, EnginePhase } from '../models/engine-context.model';
import { EngineOutput, ProgressionAction } from '../models/engine-output.model';
import { PhysiologicalState } from '../models/interpretation.model';
import { DecisionResult } from './decision.service';

function roundToPlate(value: number): number {
  if (value < 1) return Math.round(value / 0.25) * 0.25;
  if (value < 2) return Math.round(value / 0.5) * 0.5;
  if (value < 3.75) return Math.round(value / 1.25) * 1.25;
  return Math.round(value / 2.5) * 2.5;
}

@Injectable()
export class PrescriptionBuilderService {
  build(
    context: EngineContext,
    decision: DecisionResult,
    confidence: ConfidenceResult,
    primaryState: PhysiologicalState,
  ): EngineOutput {
    const normalizedGoalMode = normalizeGoalMode(context.goalMode);
    const normalizedExperience = normalizeExperienceLevel(context.experienceLevel);
    const levelConfig = EXPERIENCE_LEVEL_CONFIG[normalizedExperience];
    const baseIncrement =
      BASE_INCREMENT[context.exerciseCategory][normalizedGoalMode] ?? 0.01;
    const scaledIncrement =
      baseIncrement *
      levelConfig.loadIncrementMultiplier *
      confidence.progressionAggressiveness;

    const repRange = this.getRepRange(context, normalizedGoalMode, levelConfig.repRangeWidth);
    const currentWeight = context.currentWeight;
    let weightTarget = currentWeight;
    let setTarget = context.templateSetCount;
    let coachingNote: string | null = null;

    switch (decision.action) {
      case ProgressionAction.PROGRESS_LOAD:
        weightTarget = roundToPlate(currentWeight + currentWeight * scaledIncrement);
        break;
      case ProgressionAction.PROGRESS_REPS:
        weightTarget = currentWeight;
        repRange.high = repRange.high + 1;
        break;
      case ProgressionAction.REDUCE_INTENSITY:
        weightTarget = roundToPlate(currentWeight * (1 - 0.1 * Math.max(0.5, confidence.progressionAggressiveness)));
        break;
      case ProgressionAction.DELOAD_LOCAL:
      case ProgressionAction.DELOAD_SYSTEMIC:
        weightTarget = roundToPlate(currentWeight * 0.8);
        setTarget = Math.max(context.templateSetCount - 1, 2);
        break;
      case ProgressionAction.REDUCE_VOLUME:
        weightTarget = currentWeight;
        setTarget = Math.max(context.currentSetCount - 1, 2);
        break;
      case ProgressionAction.CALIBRATION_PHASE:
        weightTarget = roundToPlate(currentWeight * 0.95);
        coachingNote =
          'Building your baseline - log your best effort. Prescriptions become personalised from session 3 onward.';
        break;
      case ProgressionAction.HOLD_FATIGUE:
      case ProgressionAction.MAINTAIN:
      case ProgressionAction.RECOVERY_INTERVENTION:
      default:
        weightTarget = currentWeight;
        break;
    }

    const reason = this.buildReason(decision.action, primaryState, context.enginePhase);

    return {
      action: decision.action,
      enginePhase: context.enginePhase,
      physiologicalState: primaryState,
      confidence: confidence.level,
      progressionAggressiveness: confidence.progressionAggressiveness,
      weightTarget,
      repRangeLow: repRange.low,
      repRangeHigh: repRange.high,
      setTarget,
      progressionStep: decision.progressionStep,
      reason,
      coachingNote,
    };
  }

  private getRepRange(
    context: EngineContext,
    goalMode: string,
    repRangeWidth: number,
  ): { low: number; high: number } {
    const baseline = GOAL_MODE_REP_RANGES[goalMode]?.[context.exerciseCategory] ?? {
      low: 8,
      high: 12,
    };
    const halfWidth = Math.max(1, Math.floor(repRangeWidth / 2));
    return {
      low: Math.max(1, baseline.low - (halfWidth - 1)),
      high: baseline.high + (halfWidth - 1),
    };
  }

  private buildReason(
    action: ProgressionAction,
    state: PhysiologicalState,
    phase: EnginePhase,
  ): string {
    if (phase === EnginePhase.BASELINE || phase === EnginePhase.CALIBRATING) {
      return 'Insufficient completed sessions for this exercise. Applying conservative calibration.';
    }

    const actionReason: Record<ProgressionAction, string> = {
      [ProgressionAction.PROGRESS_REPS]:
        'Productive adaptation with enough confidence to progress reps.',
      [ProgressionAction.PROGRESS_LOAD]:
        'Productive adaptation with enough confidence to progress load.',
      [ProgressionAction.MAINTAIN]:
        'Current trajectory is stable; maintain current prescription.',
      [ProgressionAction.HOLD_FATIGUE]:
        'Fatigue indicators are elevated; hold progression for recovery.',
      [ProgressionAction.REDUCE_VOLUME]:
        'Volume load appears high relative to recovery signal; reduce volume.',
      [ProgressionAction.REDUCE_INTENSITY]:
        'Intensity appears too aggressive for current readiness; reduce load.',
      [ProgressionAction.DELOAD_LOCAL]:
        'Local injury-risk signal detected; local deload applied.',
      [ProgressionAction.DELOAD_SYSTEMIC]:
        'Systemic fatigue signal detected; systemic deload applied.',
      [ProgressionAction.CALIBRATION_PHASE]:
        'Calibration phase prescription due to limited history.',
      [ProgressionAction.RECOVERY_INTERVENTION]:
        'Recovery intervention selected from physiological interpretation.',
    };

    return `${actionReason[action]} Primary state: ${state}.`;
  }
}
