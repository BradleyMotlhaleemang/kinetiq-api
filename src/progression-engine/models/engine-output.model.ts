import { ConfidenceLevel } from './confidence.model';
import { EnginePhase } from './engine-context.model';
import { PhysiologicalState } from './interpretation.model';

export enum ProgressionAction {
  PROGRESS_REPS = 'PROGRESS_REPS',
  PROGRESS_LOAD = 'PROGRESS_LOAD',
  MAINTAIN = 'MAINTAIN',
  HOLD_FATIGUE = 'HOLD_FATIGUE',
  REDUCE_VOLUME = 'REDUCE_VOLUME',
  REDUCE_INTENSITY = 'REDUCE_INTENSITY',
  DELOAD_LOCAL = 'DELOAD_LOCAL',
  DELOAD_SYSTEMIC = 'DELOAD_SYSTEMIC',
  CALIBRATION_PHASE = 'CALIBRATION_PHASE',
  RECOVERY_INTERVENTION = 'RECOVERY_INTERVENTION',
}

export interface EngineOutput {
  action: ProgressionAction;
  enginePhase: EnginePhase;
  physiologicalState: PhysiologicalState;
  confidence: ConfidenceLevel;
  progressionAggressiveness: number;
  weightTarget: number;
  repRangeLow: number;
  repRangeHigh: number;
  setTarget: number;
  progressionStep: 'REPS' | 'EXECUTION' | 'LOAD' | 'SETS' | null;
  reason: string;
  coachingNote: string | null;
}
