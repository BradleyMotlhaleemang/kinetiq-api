import { validateTemplateStructure } from './template-validation';
import { HYPERTROPHY_MIN_REPS_MESSAGE } from './program-goal.utils';

const baseWorkoutDay = {
  dayNumber: 1,
  dayType: 'WORKOUT' as const,
  label: 'Monday',
  exercises: [
    {
      exerciseId: 'ex-1',
      setsTarget: 3,
      repRangeMin: 8,
      repRangeMax: 12,
      rpeTarget: 7.5,
    },
  ],
};

describe('validateTemplateStructure goal-based rep rules', () => {
  it('rejects hypertrophy programs with repRangeMin below 5', () => {
    const errors = validateTemplateStructure({
      daysPerWeek: 1,
      goal: 'HYPERTROPHY',
      days: [
        {
          ...baseWorkoutDay,
          exercises: [{ ...baseWorkoutDay.exercises[0], repRangeMin: 4, repRangeMax: 8 }],
        },
      ],
    });
    expect(errors.some((e) => e.includes(HYPERTROPHY_MIN_REPS_MESSAGE))).toBe(true);
  });

  it('allows strength programs with repRangeMin below 5', () => {
    const errors = validateTemplateStructure({
      daysPerWeek: 1,
      goal: 'STRENGTH',
      days: [
        {
          ...baseWorkoutDay,
          exercises: [{ ...baseWorkoutDay.exercises[0], repRangeMin: 3, repRangeMax: 5 }],
        },
      ],
    });
    expect(errors.some((e) => e.includes(HYPERTROPHY_MIN_REPS_MESSAGE))).toBe(false);
  });

  it('allows powerbuilding programs with repRangeMin below 5', () => {
    const errors = validateTemplateStructure({
      daysPerWeek: 1,
      goal: 'POWERBUILDING',
      days: [
        {
          ...baseWorkoutDay,
          exercises: [{ ...baseWorkoutDay.exercises[0], repRangeMin: 4, repRangeMax: 6 }],
        },
      ],
    });
    expect(errors.some((e) => e.includes(HYPERTROPHY_MIN_REPS_MESSAGE))).toBe(false);
  });
});
