import { ConfidenceLevel } from '../models/confidence.model';

export const EXPERIENCE_LEVEL_CONFIG = {
  BEGINNER: {
    loadIncrementMultiplier: 1.5,
    repRangeWidth: 4,
    deloadSensitivity: 0.5,
    confidenceThresholdForProgress: ConfidenceLevel.MODERATE_CONFIDENCE,
    aggressivenessModifier: 1.2,
    sorenessWeight: 0.5,
  },
  INTERMEDIATE: {
    loadIncrementMultiplier: 1.0,
    repRangeWidth: 3,
    deloadSensitivity: 1.0,
    confidenceThresholdForProgress: ConfidenceLevel.MODERATE_CONFIDENCE,
    aggressivenessModifier: 1.0,
    sorenessWeight: 1.0,
  },
  ADVANCED: {
    loadIncrementMultiplier: 0.5,
    repRangeWidth: 2,
    deloadSensitivity: 1.5,
    confidenceThresholdForProgress: ConfidenceLevel.HIGH_CONFIDENCE,
    aggressivenessModifier: 0.7,
    sorenessWeight: 1.3,
  },
} as const;

export type ExperienceLevelKey = keyof typeof EXPERIENCE_LEVEL_CONFIG;

export function normalizeExperienceLevel(experienceLevel: string): ExperienceLevelKey {
  const normalized = experienceLevel?.toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'BEGINNER' || normalized === 'NOVICE') return 'BEGINNER';
  if (normalized === 'ADVANCED') return 'ADVANCED';
  return 'INTERMEDIATE';
}
