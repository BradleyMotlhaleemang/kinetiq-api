import { validateHypertrophyRepMin } from './program-goal.utils';
import { resolveRpeTarget } from './rpe.utils';

export type TemplateSlotInput = {
  setsTarget: number;
  repRangeMin: number;
  repRangeMax: number;
  rpeTarget?: number | null;
  exerciseId?: string | null;
};

export type TemplateDayInput = {
  dayNumber: number;
  dayType: 'WORKOUT' | 'REST';
  label: string;
  exercises?: TemplateSlotInput[];
};

export type TemplateStructureInput = {
  daysPerWeek: number;
  days: TemplateDayInput[];
  goal?: string | null;
};

export function validateTemplateStructure(input: TemplateStructureInput): string[] {
  const errors: string[] = [];
  const workoutDays = input.days.filter((d) => d.dayType === 'WORKOUT');

  if (workoutDays.length === 0) {
    errors.push('At least one workout day is required');
  }
  if (workoutDays.length !== input.daysPerWeek) {
    errors.push(`daysPerWeek (${input.daysPerWeek}) must match workout day count (${workoutDays.length})`);
  }

  for (const day of workoutDays) {
    if (!day.label?.trim()) {
      errors.push(`Workout day ${day.dayNumber} is missing a label`);
    }
    const exercises = day.exercises ?? [];
    if (exercises.length === 0) {
      errors.push(`Workout day "${day.label}" has no exercises`);
      continue;
    }
    for (const [index, slot] of exercises.entries()) {
      if (!slot.exerciseId) {
        errors.push(`Day "${day.label}" slot ${index + 1} is missing an exercise`);
      }
      if (slot.setsTarget <= 0) {
        errors.push(`Day "${day.label}" slot ${index + 1} must have setsTarget > 0`);
      }
      if (slot.repRangeMin > slot.repRangeMax) {
        errors.push(`Day "${day.label}" slot ${index + 1} has invalid rep range`);
      }
      const repMinError = validateHypertrophyRepMin(input.goal, slot.repRangeMin);
      if (repMinError) {
        errors.push(`Day "${day.label}" slot ${index + 1}: ${repMinError}`);
      }
      const rpe = resolveRpeTarget(slot.repRangeMin, slot.repRangeMax, slot.rpeTarget);
      if (rpe < 6 || rpe > 10) {
        errors.push(`Day "${day.label}" slot ${index + 1} has invalid RPE target`);
      }
    }
  }

  return errors;
}
