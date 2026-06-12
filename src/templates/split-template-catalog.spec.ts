import { splitTemplates } from '../../prisma/data/split-template-catalog';
import { deriveRpeTarget } from './rpe.utils';

describe('split template catalog data', () => {
  it('exports 10 templates with unique slugs', () => {
    expect(splitTemplates).toHaveLength(10);
    const slugs = splitTemplates.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(10);
    expect(slugs).toContain('full-body-3x');
    expect(slugs).toContain('ppl-6x');
  });

  it('each template has 7 calendar days', () => {
    for (const tpl of splitTemplates) {
      expect(tpl.days).toHaveLength(7);
      expect(tpl.dayStructure).toHaveLength(7);
    }
  });

  it('workout days reference exercises by name', () => {
    const names = new Set<string>();
    for (const tpl of splitTemplates) {
      for (const day of tpl.days) {
        if (day.type !== 'WORKOUT' || !day.exercises) continue;
        for (const ex of day.exercises) {
          expect(ex.name.length).toBeGreaterThan(0);
          names.add(ex.name);
        }
      }
    }
    expect(names.size).toBeGreaterThan(50);
  });

  it('workout days always include exercises', () => {
    for (const tpl of splitTemplates) {
      for (const day of tpl.days) {
        if (day.type !== 'WORKOUT') continue;
        expect(day.exercises?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('workout slots have valid sets, reps, and RPE', () => {
    for (const tpl of splitTemplates) {
      const workoutDays = tpl.days.filter((d) => d.type === 'WORKOUT');
      expect(workoutDays.length).toBe(tpl.daysPerWeek);
      for (const day of workoutDays) {
        for (const ex of day.exercises ?? []) {
          expect(ex.setsTarget).toBeGreaterThan(0);
          expect(ex.repRangeMin).toBeLessThanOrEqual(ex.repRangeMax);
          const rpe = ex.rpeTarget ?? deriveRpeTarget(ex.repRangeMin, ex.repRangeMax);
          expect(rpe).toBeGreaterThanOrEqual(6);
          expect(rpe).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('filter chips have at least one matching template', () => {
    const chips = [
      { goal: 'HYPERTROPHY' },
      { goal: 'STRENGTH' },
      { goal: 'POWERBUILDING' },
      { splitStyle: 'FULL_BODY' },
    ] as const;

    for (const chip of chips) {
      const matches = splitTemplates.filter((tpl) => {
        if ('goal' in chip && chip.goal) {
          if (chip.goal === 'POWERBUILDING') {
            return tpl.goalTags.includes('POWERBUILDING') || tpl.goalTags.includes('STRENGTH');
          }
          return tpl.goalTags.includes(chip.goal);
        }
        if ('splitStyle' in chip && chip.splitStyle === 'FULL_BODY') {
          return tpl.slug.startsWith('full-body');
        }
        return false;
      });
      expect(matches.length).toBeGreaterThan(0);
    }
  });
});
