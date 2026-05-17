export type ProgressionStep = 'REPS' | 'EXECUTION' | 'LOAD' | 'SETS';

export function resolveProgressionStep(input: {
  repCompletionRate: number;
  completionRate: number;
  hasExecutionIssue: boolean;
  canAddSets: boolean;
}): ProgressionStep {
  if (input.repCompletionRate < 1) return 'REPS';
  if (input.hasExecutionIssue) return 'EXECUTION';
  if (input.completionRate >= 1) return 'LOAD';
  if (input.canAddSets) return 'SETS';
  return 'LOAD';
}
