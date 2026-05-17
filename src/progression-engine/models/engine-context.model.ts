import { ExerciseCategory } from '@prisma/client';

export enum EnginePhase {
  BASELINE = 'BASELINE',
  CALIBRATING = 'CALIBRATING',
  LEARNING = 'LEARNING',
  ACTIVE = 'ACTIVE',
}

export interface PrescriptionDelta {
  prescribedWeight: number;
  prescribedReps: number;
  prescribedSets: number;
  actualWeight: number;
  actualReps: number;
  actualSets: number;
  completionRate: number;
  repCompletionRate: number;
  weightAdherence: number;
}

export interface BiofeedbackContext {
  sorenessScore: number;
  jointComfortScore: number;
  effortScore: number;
  trainingDrive: number;
  pumpScore: number;
  sessionPerformance: number;
  volumeSignal: number;
}

export interface PerformanceHistoryRow {
  bestE1rm: number;
  bestWeight: number;
  bestReps: number;
  totalSets: number;
  date: Date;
}

export interface ProgressionLogRow {
  action: string;
  loggedAt: Date;
  weightTarget: number | null;
  prescribedWeight: number | null;
  prescribedReps: number | null;
  prescribedSets: number | null;
  actualWeight: number | null;
  actualReps: number | null;
  actualSets: number | null;
  completionRate: number | null;
  repCompletionRate: number | null;
  contextSnapshot: unknown;
}

export interface EngineContext {
  userId: string;
  exerciseId: string;
  exerciseCategory: ExerciseCategory;
  goalMode: string;
  experienceLevel: string;
  enginePhase: EnginePhase;
  currentWeight: number;
  currentRepCount: number;
  currentSetCount: number;
  weekNumber: number;
  templateSetCount: number;
  targetRepRangeLow: number | null;
  targetRepRangeHigh: number | null;
  prescriptionDelta: PrescriptionDelta | null;
  performanceHistory: PerformanceHistoryRow[];
  recentProgressionLogs: ProgressionLogRow[];
  biofeedback: BiofeedbackContext | null;
  mesocyclePhase: string | null;
}
