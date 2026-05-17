export enum ConfidenceLevel {
  HIGH_CONFIDENCE = 'HIGH_CONFIDENCE',
  MODERATE_CONFIDENCE = 'MODERATE_CONFIDENCE',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  VERY_LOW_CONFIDENCE = 'VERY_LOW_CONFIDENCE',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  score: number;
  factors: {
    performanceConsistency: number;
    recoveryStability: number;
    progressionSuccessRate: number;
    dataDepth: number;
  };
  progressionAggressiveness: number;
}
