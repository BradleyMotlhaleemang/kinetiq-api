import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesQueryDto } from './dto/templates-query.dto';

export interface TemplateExerciseDto {
  id: string;
  name: string;
  primaryMuscle: string | null;
}

export interface TemplateDayDto {
  id: string;
  dayNumber: number;
  label: string;
  dayType: 'WORKOUT' | 'REST';
  exercises: Array<{
    id?: string;
    orderIndex: number;
    setsTarget: number;
    repRangeMin: number;
    repRangeMax: number;
    exerciseId?: string;
    exercise: TemplateExerciseDto | null;
  }>;
}

export interface TemplateListItemDto {
  id: string;
  slug: string;
  name: string;
  goal: string;
  level: string;
  splitStyle: string;
  splitStyleLabel: string;
  daysPerWeek: number;
  durationWeeks: string;
  primaryFocus: string;
  featured: boolean;
  badge: string | null;
  difficultyWarning: string | null;
  progressionType: string;
  days: string[];
  stats: Array<{ label: string; value: string }>;
}

export interface TemplateDetailDto extends TemplateListItemDto {
  description: string | null;
  goalTags: string[];
  experienceTags: string[];
  splitConfigs: Array<{
    id: string;
    splitLabel: string;
    days: TemplateDayDto[];
  }>;
  programSummary: {
    mesocycleBlocks: number;
    workoutTemplates: number;
    totalWeeks: number;
    sessionCount: number;
  };
}

type SplitTemplateRecord = {
  id: string;
  slug: string | null;
  name: string;
  level: string;
  goal: string;
  primaryMuscle: string;
  splitLabel: string;
  splitType: string;
  daysPerWeek: number;
  description: string | null;
  goalTags: string[];
  experienceTags: string[];
  days: Array<{
    id: string;
    dayNumber: number;
    dayType: 'WORKOUT' | 'REST';
    label: string;
    exercises: Array<{
      id: string;
      exerciseId: string;
      orderIndex: number;
      setsTarget: number;
      repRangeMin: number;
      repRangeMax: number;
      exercise: {
        id: string;
        name: string;
        primaryMuscle: string;
      } | null;
    }>;
  }>;
};

function splitStyleLabel(splitType: string): string {
  const map: Record<string, string> = {
    PPL: 'Push / Pull / Legs',
    UPPER_LOWER: 'Upper / Lower',
    FULL_BODY: 'Full Body',
    HYBRID: 'Hybrid',
    BODY_PART: 'Body Part',
    POWERLIFTING: 'Powerlifting',
    POWERBUILDING: 'Powerbuilding',
    GLUTE_FOCUS: 'Glute Focus',
    QUAD_FOCUS: 'Quad Focus',
    CHEST_FOCUS: 'Chest Focus',
    SHOULDER_FOCUS: 'Shoulder Focus',
  };
  return map[splitType] ?? splitType;
}

function titleCaseValue(input: string | null | undefined): string {
  if (!input) return 'General';
  return input
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function goalTagsMatch(template: SplitTemplateRecord, goal: string): boolean {
  const normalized = goal.toUpperCase();
  const tags = template.goalTags.map((t) => t.toUpperCase());
  if (tags.includes(normalized)) return true;
  if (normalized === 'MUSCLE_GAIN' && (tags.includes('HYPERTROPHY') || tags.includes('RECOMPOSITION'))) {
    return true;
  }
  if (normalized === 'HYPERTROPHY' && tags.includes('HYPERTROPHY')) return true;
  return false;
}

const FEATURED_SLUGS = new Set(['upper-lower-4x', 'ppl-6x']);

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    days: {
      orderBy: { dayNumber: 'asc' as const },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' as const },
          include: {
            exercise: {
              select: { id: true, name: true, primaryMuscle: true },
            },
          },
        },
      },
    },
  } as const;

  private mapDay(day: SplitTemplateRecord['days'][number]): TemplateDayDto {
    return {
      id: day.id,
      dayNumber: day.dayNumber,
      label: day.label,
      dayType: day.dayType,
      exercises: day.exercises.map((exercise) => ({
        id: exercise.id,
        orderIndex: exercise.orderIndex,
        setsTarget: exercise.setsTarget,
        repRangeMin: exercise.repRangeMin,
        repRangeMax: exercise.repRangeMax,
        exerciseId: exercise.exerciseId,
        exercise: exercise.exercise
          ? {
              id: exercise.exercise.id,
              name: exercise.exercise.name,
              primaryMuscle: exercise.exercise.primaryMuscle,
            }
          : null,
      })),
    };
  }

  private buildListItem(template: SplitTemplateRecord): TemplateListItemDto {
    const days = template.days.map((day) => day.label);
    const featured =
      (template.slug && FEATURED_SLUGS.has(template.slug)) ||
      template.name === 'Upper Lower 4x' ||
      template.name === 'PPL 6x';
    const badge =
      template.daysPerWeek >= 6
        ? 'ADVANCED'
        : featured
          ? 'RECOMMENDED'
          : null;

    return {
      id: template.id,
      slug: template.slug ?? template.id,
      name: template.name,
      goal: titleCaseValue(template.goalTags[0] ?? template.goal),
      level: titleCaseValue(template.experienceTags[0] ?? template.level),
      splitStyle: template.splitType,
      splitStyleLabel: splitStyleLabel(template.splitType),
      daysPerWeek: template.daysPerWeek,
      durationWeeks: '8',
      primaryFocus: titleCaseValue(template.primaryMuscle),
      featured,
      badge,
      difficultyWarning: template.daysPerWeek >= 6 ? 'High recovery demand' : null,
      progressionType: 'Progressive overload',
      days,
      stats: [
        { label: 'Sessions', value: `${template.daysPerWeek}x/week` },
        { label: 'Duration', value: '8 weeks' },
        { label: 'Focus', value: titleCaseValue(template.primaryMuscle) },
        {
          label: 'Level',
          value: titleCaseValue(template.experienceTags[0] ?? template.level),
        },
      ],
    };
  }

  private buildDetail(template: SplitTemplateRecord): TemplateDetailDto {
    const list = this.buildListItem(template);
    const workoutDayCount = template.days.filter((d) => d.dayType === 'WORKOUT').length;

    return {
      ...list,
      description: template.description ?? null,
      goalTags: template.goalTags,
      experienceTags: template.experienceTags,
      splitConfigs: [
        {
          id: template.id,
          splitLabel: template.splitLabel,
          days: template.days.map((day) => this.mapDay(day)),
        },
      ],
      programSummary: {
        mesocycleBlocks: 1,
        workoutTemplates: workoutDayCount,
        totalWeeks: 8,
        sessionCount: workoutDayCount * 8,
      },
    };
  }

  async findAll(query: TemplatesQueryDto): Promise<TemplateListItemDto[]> {
    const where: Record<string, unknown> = { isSystem: true };
    if (query.goal) {
      const goal = query.goal.toUpperCase();
      where['OR'] = [
        { goalTags: { has: goal } },
        ...(goal === 'MUSCLE_GAIN'
          ? [{ goalTags: { has: 'HYPERTROPHY' } }, { goalTags: { has: 'RECOMPOSITION' } }]
          : []),
      ];
    }
    if (query.level) where['experienceTags'] = { has: query.level.toUpperCase() };
    if (query.splitStyle) where['splitType'] = query.splitStyle.toUpperCase();
    if (query.daysPerWeekMin || query.daysPerWeekMax) {
      where['daysPerWeek'] = {};
      if (query.daysPerWeekMin) (where['daysPerWeek'] as Record<string, number>)['gte'] = query.daysPerWeekMin;
      if (query.daysPerWeekMax) (where['daysPerWeek'] as Record<string, number>)['lte'] = query.daysPerWeekMax;
    }
    if (query.search) where['name'] = { contains: query.search, mode: 'insensitive' };

    const records = (await this.prisma.splitTemplate.findMany({
      where,
      include: this.include,
      orderBy: [{ daysPerWeek: 'asc' }, { name: 'asc' }],
    })) as unknown as SplitTemplateRecord[];

    return records
      .map((record) => this.buildListItem(record))
      .filter((record) => !query.featuredOnly || record.featured);
  }

  async findOne(idOrSlug: string): Promise<TemplateDetailDto> {
    const record = (await this.prisma.splitTemplate.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: this.include,
    })) as unknown as SplitTemplateRecord | null;

    if (!record) throw new NotFoundException(`Template "${idOrSlug}" not found`);
    return this.buildDetail(record);
  }

  async recommendForUser(userId: string, daysAvailable = 4) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { goalMode: true, experienceLevel: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const goal = (user.goalMode ?? 'MUSCLE_GAIN').toUpperCase();
    const level = (user.experienceLevel ?? 'INTERMEDIATE').toUpperCase();

    return this.recommend(goal, level, daysAvailable);
  }

  async recommend(goal: string, level: string, daysAvailable: number) {
    const records = (await this.prisma.splitTemplate.findMany({
      where: { isSystem: true, daysPerWeek: { lte: daysAvailable } },
      include: this.include,
      orderBy: [{ daysPerWeek: 'desc' }, { name: 'asc' }],
    })) as unknown as SplitTemplateRecord[];

    if (records.length === 0) throw new NotFoundException('No templates available');

    const score = (template: SplitTemplateRecord) => {
      let points = 0;
      if (goalTagsMatch(template, goal)) points += 5;
      if (template.experienceTags.map((t) => t.toUpperCase()).includes(level)) points += 4;
      points -= Math.abs(template.daysPerWeek - daysAvailable);
      if (template.slug === 'upper-lower-4x') points += 1;
      return points;
    };

    const sorted = [...records].sort((a, b) => score(b) - score(a));
    const recommended = sorted[0]!;
    const alternatives = sorted.slice(1, 4).map((template) => this.buildListItem(template));

    return {
      recommended: this.buildDetail(recommended),
      alternatives,
      rationale: `Matched on goal=${goal}, level=${level}, daysAvailable=${daysAvailable}`,
      profile: {
        goalModeLabel: titleCaseValue(goal),
        experienceLevelLabel: titleCaseValue(level),
      },
    };
  }

  async expand(templateId: string): Promise<TemplateDetailDto> {
    return this.findOne(templateId);
  }
}
