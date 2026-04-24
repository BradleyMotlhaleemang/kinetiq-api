// src/templates/templates.service.spec.ts
// Run: npx jest templates.service --coverage

import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService }    from './templates.service';
import { PrismaService }       from '../prisma/prisma.service';
import { ExperienceLevel, TrainingGoal, SplitStyle } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

// ── Shared fixture factory ────────────────────────────────────────
function makeMesocycleTemplate(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id:               'tmpl-uuid-1',
    slug:             'MC-017',
    name:             'PPL — 6 Day',
    level:            ExperienceLevel.INTERMEDIATE,
    goal:             TrainingGoal.HYPERTROPHY,
    splitStyle:       SplitStyle.PPL,
    primaryFocus:     'Balanced',
    durationWeeksMin: 8,
    durationWeeksMax: 8,
    daysPerWeek:      6,
    progressionType:  'RPE-based',
    progressionNotes: 'Increase load weekly',
    deloadWeek:       8,
    deloadNotes:      'Reduce fatigue',
    difficultyWarning: null,
    featured:          true,
    createdAt:         new Date(),
    updatedAt:         new Date(),
    days: [
      {
        id:                  'd1',
        mesocycleTemplateId: 'tmpl-uuid-1',
        dayNumber:           1,
        label:               'Push (A)',
        isRestDay:           false,
        workoutTemplateId:   'wt-push-i',
        workoutTemplate: {
          id:            'wt-push-i',
          slug:          'WT-PUSH-I',
          name:          'Push Day Intermediate',
          level:         ExperienceLevel.INTERMEDIATE,
          goal:          TrainingGoal.HYPERTROPHY,
          primaryMuscle: 'Push',
          createdAt:     new Date(),
          updatedAt:     new Date(),
          slots: [
            { id:'s1', workoutTemplateId:'wt-push-i', order:1, slotLabel:'Heavy Bench', setsMin:4, setsMax:4, repsMin:5, repsMax:8, rpeMin:7, rpeMax:9, notes:null },
            { id:'s2', workoutTemplateId:'wt-push-i', order:2, slotLabel:'Incline Press', setsMin:3, setsMax:4, repsMin:8, repsMax:12, rpeMin:7, rpeMax:9, notes:null },
          ],
        },
      },
      {
        id:                  'd7',
        mesocycleTemplateId: 'tmpl-uuid-1',
        dayNumber:           7,
        label:               'Rest',
        isRestDay:           true,
        workoutTemplateId:   null,
        workoutTemplate:     null,
      },
    ],
    ...overrides,
  };
}

// ── Mock PrismaService ────────────────────────────────────────────
const mockPrisma = {
  mesocycleTemplate: {
    findMany:  jest.fn(),
    findFirst: jest.fn(),
  },
};

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TemplatesService>(TemplatesService);
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns mapped list items', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([makeMesocycleTemplate()]);
      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('MC-017');
      expect(result[0].goal).toBe('Hypertrophy');
      expect(result[0].level).toBe('Intermediate');
      expect(result[0].splitStyleLabel).toBe('Push / Pull / Legs');
      expect(result[0].durationWeeks).toBe('8');
      expect(result[0].badge).toBe('RECOMMENDED');
      expect(result[0].days).toEqual(['Push (A)']);  // only non-rest days
    });

    it('applies goal filter to where clause', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([]);
      await service.findAll({ goal: 'hypertrophy' });

      expect(mockPrisma.mesocycleTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ goal: 'HYPERTROPHY' }),
        }),
      );
    });

    it('applies featuredOnly filter', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([]);
      await service.findAll({ featuredOnly: true });

      expect(mockPrisma.mesocycleTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ featured: true }),
        }),
      );
    });

    it('applies daysPerWeek range filter', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([]);
      await service.findAll({ daysPerWeekMin: 3, daysPerWeekMax: 5 });

      expect(mockPrisma.mesocycleTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            daysPerWeek: { gte: 3, lte: 5 },
          }),
        }),
      );
    });
  });

  // ── findOne ──────────────────────────────────────────────────────
  describe('findOne', () => {
    it('returns detailed template with trainingDays and programSummary', async () => {
      mockPrisma.mesocycleTemplate.findFirst.mockResolvedValue(makeMesocycleTemplate());
      const result = await service.findOne('MC-017');

      // Detail-specific fields
      expect(result.trainingDays).toBeDefined();
      expect(result.programSummary).toBeDefined();
      expect(result.programSummary.totalWeeks).toBe(8);
      expect(result.programSummary.mesocycleBlocks).toBe(1);

      // Slot expansion
      const pushDay = result.trainingDays.find(d => d.dayNumber === 1);
      expect(pushDay?.workoutTemplate?.slots).toHaveLength(2);
      expect(pushDay?.workoutTemplate?.slots[0].slotLabel).toBe('Heavy Bench');
      expect(pushDay?.workoutTemplate?.slots[0].sets).toBe('4');
      expect(pushDay?.workoutTemplate?.slots[0].reps).toBe('5–8');
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.mesocycleTemplate.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('rest days have null workoutTemplate', async () => {
      mockPrisma.mesocycleTemplate.findFirst.mockResolvedValue(makeMesocycleTemplate());
      const result = await service.findOne('MC-017');
      const restDay = result.trainingDays.find(d => d.isRestDay);
      expect(restDay?.workoutTemplate).toBeNull();
    });
  });

  // ── recommend ────────────────────────────────────────────────────
  describe('recommend', () => {
    it('returns recommended + alternatives + rationale', async () => {
      mockPrisma.mesocycleTemplate.findFirst.mockResolvedValue(makeMesocycleTemplate());
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([]);

      const result = await service.recommend(
        ExperienceLevel.INTERMEDIATE,
        TrainingGoal.HYPERTROPHY,
        6,
      );

      expect(result.recommended.slug).toBe('MC-017');
      expect(result.alternatives).toEqual([]);
      expect(result.rationale).toContain('Hypertrophy');
    });

    it('throws if no templates match', async () => {
      mockPrisma.mesocycleTemplate.findFirst
        .mockResolvedValueOnce(null)   // exact
        .mockResolvedValueOnce(null);  // fallback
      await expect(
        service.recommend(ExperienceLevel.NOVICE, TrainingGoal.POWERLIFTING, 2),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Label mapping ─────────────────────────────────────────────────
  describe('label mapping', () => {
    it('maps BODY_PART split style correctly', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([
        makeMesocycleTemplate({ splitStyle: SplitStyle.BODY_PART }),
      ]);
      const [item] = await service.findAll({});
      expect(item.splitStyleLabel).toBe('Body Part Split');
    });

    it('ADVANCED level with daysPerWeek=6 gets ADVANCED badge', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([
        makeMesocycleTemplate({ level: ExperienceLevel.ADVANCED, daysPerWeek: 6, featured: false }),
      ]);
      const [item] = await service.findAll({});
      expect(item.badge).toBe('ADVANCED');
    });

    it('duration range formatted correctly', async () => {
      mockPrisma.mesocycleTemplate.findMany.mockResolvedValue([
        makeMesocycleTemplate({ durationWeeksMin: 8, durationWeeksMax: 10 }),
      ]);
      const [item] = await service.findAll({});
      expect(item.durationWeeks).toBe('8–10');
    });
  });
});