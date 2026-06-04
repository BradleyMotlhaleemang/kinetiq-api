import { splitTemplates } from '../../prisma/data/split-template-catalog';

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
});
