/**
 * Canonical joint pain scale for Kinetiq.
 *
 * UI presents 0–5 severity; engine/substitution use 0–9 internal scores.
 * Mapping is fixed — retune thresholds in interpretation-matrix.constants.ts
 * only alongside this table.
 */
export const JOINT_PAIN_UI_MIN = 0;
export const JOINT_PAIN_UI_MAX = 5;

/** Internal scores accepted by biofeedback validation and progression. */
export const INTERNAL_JOINT_SCORES = [0, 1, 3, 6, 8, 9] as const;
export type InternalJointScore = (typeof INTERNAL_JOINT_SCORES)[number];

/** UI 0–5 → internal 0–9 */
export const UI_TO_INTERNAL_JOINT_SCORE: Record<number, InternalJointScore> = {
  0: 0,
  1: 1,
  2: 3,
  3: 6,
  4: 8,
  5: 9,
};

/** Substitution / volume MONITOR band (internal): >4 and <=6 */
export const JOINT_PAIN_MONITOR_MIN = 3;
export const JOINT_PAIN_MONITOR_MAX = 6;

/** Progression INJURY_RISK + substitution SUBSTITUTE threshold (internal) */
export const JOINT_PAIN_SEVERE_MIN = 6;

export function uiSeverityToInternal(uiScore: number): number {
  const clamped = Math.max(
    JOINT_PAIN_UI_MIN,
    Math.min(JOINT_PAIN_UI_MAX, Math.round(uiScore)),
  );
  return UI_TO_INTERNAL_JOINT_SCORE[clamped] ?? 0;
}

export function isAllowedInternalJointScore(score: number): boolean {
  return (INTERNAL_JOINT_SCORES as readonly number[]).includes(score);
}

export const JOINT_TRIAGE_OUTCOMES = [
  'HEALTHY',
  'MILD',
  'SIGNIFICANT',
  'SKIPPED',
] as const;
export type JointTriageOutcome = (typeof JOINT_TRIAGE_OUTCOMES)[number];
