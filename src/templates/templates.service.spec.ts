import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExperienceLevel, TrainingGoal } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

function makeSplitTemplate(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'tmpl-uuid-1',
    slug: 'ppl-6x',
    name: 'PPL 6x',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Push',
    splitLabel: 'PPL 6x',
    splitType: 'PPL',
    daysPerWeek: 6,
    description: 'Six-day PPL',
    goalTags: ['HYPERTROPHY'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    isSystem: true,
    days: [
      {
        id: 'day-1',
        dayNumber: 1,
        dayType: 'WORKOUT' as const,
        label: 'Push A',
        exercises: [
          {
            id: 'sde-1',
            exerciseId: 'ex-1',
            orderIndex: 1,
            setsTarget: 4,
            repRangeMin: 6,
            repRangeMax: 10,
            exercise: {
              id: 'ex-1',
              name: 'Barbell Bench Press',
              primaryMuscle: 'CHEST',
            },
          },
        ],
      },
      {
        id: 'day-7',
        dayNumber: 7,
        dayType: 'REST' as const,
        label: 'Rest',
        exercises: [],
      },
    ],
    ...overrides,
  };
}

const mockPrisma = {
  splitTemplate: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
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

  describe('findAll', () => {
    it('returns mapped list items with full week labels', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([makeSplitTemplate()]);
      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('ppl-6x');
      expect(result[0].goal).toBe('Hypertrophy');
      expect(result[0].level).toBe('Intermediate');
      expect(result[0].splitStyleLabel).toBe('Push / Pull / Legs');
      expect(result[0].badge).toBe('ADVANCED');
      expect(result[0].days).toEqual(['Push A', 'Rest']);
    });

    it('applies goal filter to where clause', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([]);
      await service.findAll({ goal: 'hypertrophy' });

      expect(mockPrisma.splitTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { goalTags: { has: 'HYPERTROPHY' } },
            ]),
          }),
        }),
      );
    });

    it('applies daysPerWeek range filter', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([]);
      await service.findAll({ daysPerWeekMin: 3, daysPerWeekMax: 5 });

      expect(mockPrisma.splitTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            daysPerWeek: { gte: 3, lte: 5 },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns detailed template with splitConfigs and programSummary', async () => {
      mockPrisma.splitTemplate.findFirst.mockResolvedValue(makeSplitTemplate());
      const result = await service.findOne('ppl-6x');

      expect(result.splitConfigs).toHaveLength(1);
      expect(result.programSummary.totalWeeks).toBe(8);
      expect(result.programSummary.workoutTemplates).toBe(1);

      const pushDay = result.splitConfigs[0].days.find((d) => d.dayNumber === 1);
      expect(pushDay?.dayType).toBe('WORKOUT');
      expect(pushDay?.id).toBe('day-1');
      expect(pushDay?.exercises).toHaveLength(1);
      expect(pushDay?.exercises[0].exercise?.name).toBe('Barbell Bench Press');
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.splitTemplate.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('rest days have empty exercises', async () => {
      mockPrisma.splitTemplate.findFirst.mockResolvedValue(makeSplitTemplate());
      const result = await service.findOne('ppl-6x');
      const restDay = result.splitConfigs[0].days.find((d) => d.dayNumber === 7);
      expect(restDay?.dayType).toBe('REST');
      expect(restDay?.exercises).toEqual([]);
    });
  });

  describe('recommend', () => {
    it('returns recommended + alternatives + rationale', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([
        makeSplitTemplate(),
        makeSplitTemplate({ id: 'tmpl-2', slug: 'full-body-3x', name: 'Full Body 3x', daysPerWeek: 3 }),
      ]);

      const result = await service.recommend('MUSCLE_GAIN', 'INTERMEDIATE', 6);

      expect(result.recommended.slug).toBe('ppl-6x');
      expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
      expect(result.rationale).toContain('MUSCLE_GAIN');
    });

    it('throws if no templates match', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([]);
      await expect(
        service.recommend('POWERLIFTING', ExperienceLevel.BEGINNER, 2),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('label mapping', () => {
    it('maps BODY_PART split type correctly', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([
        makeSplitTemplate({ splitType: 'BODY_PART', slug: 'bro-split-5x' }),
      ]);
      const [item] = await service.findAll({});
      expect(item.splitStyleLabel).toBe('Body Part');
    });

    it('ADVANCED level with daysPerWeek=6 gets ADVANCED badge', async () => {
      mockPrisma.splitTemplate.findMany.mockResolvedValue([
        makeSplitTemplate({
          experienceTags: [ExperienceLevel.ADVANCED],
          daysPerWeek: 6,
          slug: 'high-frequency-6x',
        }),
      ]);
      const [item] = await service.findAll({});
      expect(item.badge).toBe('ADVANCED');
    });
  });
});
