export function clampFatigueScore(value: number): number {
  return Math.max(0, Math.min(10, value));
}

export function classifyLocalFatigue(input: {
  sorenessScore: number;
  pumpScore: number;
  completionRate: number;
}): number {
  const soreness = input.sorenessScore;
  const lowPumpPenalty = input.pumpScore <= 2 ? 2 : 0;
  const underCompletionPenalty = input.completionRate < 0.8 ? 2 : 0;
  return clampFatigueScore(soreness + lowPumpPenalty + underCompletionPenalty);
}

export function classifySystemicFatigue(input: {
  effortScore: number;
  trainingDrive: number;
  decliningPerformance: boolean;
}): number {
  const effortLoad = input.effortScore >= 3 ? 4 : input.effortScore >= 2 ? 2 : 1;
  const drivePenalty = input.trainingDrive <= 2 ? 3 : 0;
  const declinePenalty = input.decliningPerformance ? 3 : 0;
  return clampFatigueScore(effortLoad + drivePenalty + declinePenalty);
}
