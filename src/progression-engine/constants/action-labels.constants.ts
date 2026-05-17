import { ProgressionAction } from '../models/engine-output.model';

export const PROGRESSION_ACTION_LABELS: Record<ProgressionAction, string> = {
  [ProgressionAction.PROGRESS_REPS]: 'Progress Reps',
  [ProgressionAction.PROGRESS_LOAD]: 'Ready to Load Up',
  [ProgressionAction.MAINTAIN]: 'Maintain Current',
  [ProgressionAction.HOLD_FATIGUE]: 'Hold - Fatigue Detected',
  [ProgressionAction.REDUCE_VOLUME]: 'Reduce Volume',
  [ProgressionAction.REDUCE_INTENSITY]: 'Roll Back Load',
  [ProgressionAction.DELOAD_LOCAL]: 'Local Deload',
  [ProgressionAction.DELOAD_SYSTEMIC]: 'Full Deload',
  [ProgressionAction.CALIBRATION_PHASE]: 'Building Baseline',
  [ProgressionAction.RECOVERY_INTERVENTION]: 'Recovery Week',
};

export const PROGRESSION_ACTION_LABELS_BY_KEY: Record<string, string> = {
  ...PROGRESSION_ACTION_LABELS,
};
