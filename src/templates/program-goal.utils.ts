const STRENGTH_GOALS = new Set(['STRENGTH', 'POWERLIFTING', 'POWERBUILDING']);

export function isHypertrophyGoal(goal?: string | null): boolean {
  return (goal ?? '').toUpperCase() === 'HYPERTROPHY';
}

export function allowsLowRepPrescription(goal?: string | null): boolean {
  return STRENGTH_GOALS.has((goal ?? '').toUpperCase());
}

export const HYPERTROPHY_MIN_REPS_MESSAGE =
  'Hypertrophy programs should use at least 5 reps per set. Lower rep ranges are reserved for strength-focused programs.';

export function validateHypertrophyRepMin(
  goal: string | null | undefined,
  repRangeMin: number,
): string | null {
  if (!isHypertrophyGoal(goal) || repRangeMin >= 5) return null;
  return HYPERTROPHY_MIN_REPS_MESSAGE;
}
