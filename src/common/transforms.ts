export const GOAL_MODE_LABELS: Record<string, string> = {
  MUSCLE_GAIN: 'Build Muscle',
  STRENGTH: 'Build Strength',
  MAINTAIN: 'Maintain',
  WEIGHT_LOSS: 'Lose Fat',
  SPORT_SPECIFIC: 'Sport Specific',
};

export const SESSION_MODE_LABELS: Record<string, string> = {
  FULL: 'Full Session',
  MODIFIED: 'Modified Session',
  DELOAD: 'Deload Session',
};

export const SESSION_MODE_COLORS: Record<string, string> = {
  FULL: 'green',
  MODIFIED: 'amber',
  DELOAD: 'red',
};

export const PROGRESSION_ACTION_LABELS: Record<string, string> = {
  PROGRESS: 'Ready to Progress',
  HOLD: 'Hold Current Load',
  REDUCE: 'Reduce Load',
  DELOAD: 'Deload Recommended',
};

export const WORKOUT_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const MESOCYCLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DELOAD_TRIGGERED: 'Deload Triggered',
  DELOAD_ACTIVE: 'Deload Active',
  COMPLETED: 'Completed',
};

export const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export function transformUser(user: any) {
  if (!user) return null;
  return {
    ...user,
    goalModeLabel: user.goalMode
      ? GOAL_MODE_LABELS[user.goalMode] ?? user.goalMode
      : null,
    experienceLevelLabel: user.experienceLevel
      ? EXPERIENCE_LEVEL_LABELS[user.experienceLevel] ?? user.experienceLevel
      : null,
  };
}

export function transformWorkout(workout: any) {
  if (!workout) return null;
  return {
    ...workout,
    statusLabel: WORKOUT_STATUS_LABELS[workout.status] ?? workout.status,
  };
}

export function transformMesocycle(mesocycle: any) {
  if (!mesocycle) return null;
  return {
    ...mesocycle,
    statusLabel:
      MESOCYCLE_STATUS_LABELS[mesocycle.status] ?? mesocycle.status,
  };
}

export function transformReadiness(readiness: any) {
  if (!readiness) return null;
  return {
    ...readiness,
    sessionModeLabel:
      SESSION_MODE_LABELS[readiness.sessionMode] ?? readiness.sessionMode,
    sessionModeColor:
      SESSION_MODE_COLORS[readiness.sessionMode] ?? 'gray',
  };
}

export function transformPrescription(prescription: any) {
  if (!prescription) return null;
  return {
    ...prescription,
    actionLabel:
      PROGRESSION_ACTION_LABELS[prescription.action] ?? prescription.action,
    sessionModeLabel:
      SESSION_MODE_LABELS[prescription.sessionMode] ?? prescription.sessionMode,
    sessionModeColor:
      SESSION_MODE_COLORS[prescription.sessionMode] ?? 'gray',
  };
}