import { Injectable } from '@nestjs/common';
import {
  EXPERIENCE_LEVEL_CONFIG,
  normalizeExperienceLevel,
} from '../constants/experience-level.constants';
import { ConfidenceLevel, ConfidenceResult } from '../models/confidence.model';
import { EngineContext, EnginePhase } from '../models/engine-context.model';
import { EngineOutput, ProgressionAction } from '../models/engine-output.model';
import { InterpretationResult, PhysiologicalState } from '../models/interpretation.model';
import { resolveProgressionStep } from '../utils/progression-hierarchy.util';

export interface DecisionResult {
  action: ProgressionAction;
  progressionStep: EngineOutput['progressionStep'];
}

@Injectable()
export class DecisionService {
  decide(
    context: EngineContext,
    interpretation: InterpretationResult,
    confidence: ConfidenceResult,
  ): DecisionResult {
    if (interpretation.injuryRiskFlag) {
      return { action: ProgressionAction.DELOAD_LOCAL, progressionStep: null };
    }
    if (interpretation.systemicFatigueScore >= 8) {
      return { action: ProgressionAction.DELOAD_SYSTEMIC, progressionStep: null };
    }
    if (
      context.enginePhase === EnginePhase.BASELINE ||
      context.enginePhase === EnginePhase.CALIBRATING
    ) {
      return { action: ProgressionAction.CALIBRATION_PHASE, progressionStep: null };
    }

    const normalizedExperience = normalizeExperienceLevel(context.experienceLevel);
    const requiredConfidence =
      EXPERIENCE_LEVEL_CONFIG[normalizedExperience].confidenceThresholdForProgress;
    const canProgress = this.canProgress(confidence.level, requiredConfidence);

    const mode = context.goalMode.toUpperCase().replace(/[\s-]+/g, '_');
    const step = resolveProgressionStep({
      repCompletionRate: context.prescriptionDelta?.repCompletionRate ?? 1,
      completionRate: context.prescriptionDelta?.completionRate ?? 1,
      hasExecutionIssue:
        (context.biofeedback?.sessionPerformance ?? 3) <= 2,
      canAddSets: context.currentSetCount < context.templateSetCount + 2,
    });

    if (mode === 'STRENGTH') {
      if (
        interpretation.primaryState === PhysiologicalState.PRODUCTIVE_ADAPTATION &&
        canProgress
      ) {
        return { action: ProgressionAction.PROGRESS_LOAD, progressionStep: 'LOAD' };
      }
      if (interpretation.primaryState === PhysiologicalState.LOCAL_FATIGUE) {
        return { action: ProgressionAction.HOLD_FATIGUE, progressionStep: null };
      }
      if (interpretation.primaryState === PhysiologicalState.UNDER_RECOVERY) {
        return { action: ProgressionAction.REDUCE_INTENSITY, progressionStep: null };
      }
      return { action: ProgressionAction.MAINTAIN, progressionStep: null };
    }

    if (mode === 'MAINTAIN' || mode === 'WEIGHT_LOSS') {
      if (interpretation.primaryState === PhysiologicalState.SYSTEMIC_FATIGUE) {
        return { action: ProgressionAction.REDUCE_VOLUME, progressionStep: null };
      }
      if (interpretation.primaryState === PhysiologicalState.UNDER_RECOVERY) {
        return { action: ProgressionAction.HOLD_FATIGUE, progressionStep: null };
      }
      return { action: ProgressionAction.MAINTAIN, progressionStep: null };
    }

    if (interpretation.primaryState === PhysiologicalState.LOCAL_FATIGUE) {
      return { action: ProgressionAction.HOLD_FATIGUE, progressionStep: null };
    }
    if (
      interpretation.primaryState === PhysiologicalState.SYSTEMIC_FATIGUE ||
      interpretation.primaryState === PhysiologicalState.UNDER_RECOVERY
    ) {
      return { action: ProgressionAction.REDUCE_VOLUME, progressionStep: null };
    }
    if (
      interpretation.primaryState === PhysiologicalState.INSUFFICIENT_STIMULUS ||
      interpretation.primaryState === PhysiologicalState.AGGRESSIVE_PRESCRIPTION
    ) {
      return { action: ProgressionAction.REDUCE_INTENSITY, progressionStep: null };
    }

    if (
      interpretation.primaryState === PhysiologicalState.PRODUCTIVE_ADAPTATION &&
      canProgress
    ) {
      if (step === 'REPS') {
        return { action: ProgressionAction.PROGRESS_REPS, progressionStep: 'REPS' };
      }
      if (step === 'SETS') {
        return { action: ProgressionAction.REDUCE_VOLUME, progressionStep: 'SETS' };
      }
      return { action: ProgressionAction.PROGRESS_LOAD, progressionStep: 'LOAD' };
    }

    return { action: ProgressionAction.MAINTAIN, progressionStep: null };
  }

  private canProgress(
    confidence: ConfidenceLevel,
    required: ConfidenceLevel,
  ): boolean {
    const rank: Record<ConfidenceLevel, number> = {
      [ConfidenceLevel.INSUFFICIENT_DATA]: 0,
      [ConfidenceLevel.VERY_LOW_CONFIDENCE]: 1,
      [ConfidenceLevel.LOW_CONFIDENCE]: 2,
      [ConfidenceLevel.MODERATE_CONFIDENCE]: 3,
      [ConfidenceLevel.HIGH_CONFIDENCE]: 4,
    };
    return rank[confidence] >= rank[required];
  }
}
