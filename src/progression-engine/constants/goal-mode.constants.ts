import { ExerciseCategory } from '@prisma/client';

export const GOAL_MODE_REP_RANGES: Record<
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

export const BASE_INCREMENT: Record<ExerciseCategory, Record<string, number>> = {
  PRIMARY_COMPOUND: {
    STRENGTH: 0.03,
    MUSCLE_GAIN: 0.025,
    MAINTAIN: 0.015,
    WEIGHT_LOSS: 0.01,
  },
  COMPOUND_ACCESSORY: {
    STRENGTH: 0.025,
    MUSCLE_GAIN: 0.02,
    MAINTAIN: 0.0125,
    WEIGHT_LOSS: 0.01,
  },
  ISOLATION_PRIMARY: {
    STRENGTH: 0.015,
    MUSCLE_GAIN: 0.015,
    MAINTAIN: 0.01,
    WEIGHT_LOSS: 0.0075,
  },
  ISOLATION_AUXILIARY: {
    STRENGTH: 0.01,
    MUSCLE_GAIN: 0.01,
    MAINTAIN: 0.0075,
    WEIGHT_LOSS: 0.005,
  },
};

export function normalizeGoalMode(goalMode: string): keyof typeof GOAL_MODE_REP_RANGES {
  const normalized = goalMode?.toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'MUSCLE' || normalized === 'HYPERTROPHY') return 'MUSCLE_GAIN';
  if (
    normalized === 'STRENGTH' ||
    normalized === 'MUSCLE_GAIN' ||
    normalized === 'MAINTAIN' ||
    normalized === 'WEIGHT_LOSS'
  ) {
    return normalized;
  }
  return 'MAINTAIN';
}
