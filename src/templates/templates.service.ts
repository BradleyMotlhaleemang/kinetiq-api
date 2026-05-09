import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesQueryDto } from './dto/templates-query.dto';

export interface TemplateExerciseDto {
  id: string;
  name: string;
  primaryMuscle: string | null;
}

export interface TemplateDayDto {
  dayNumber: number;
  label: string;
  exercises: Array<{
    orderIndex: number;
    setsTarget: number;
    repRangeMin: number;
    repRangeMax: number;
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

type WorkoutTemplateWithSplit = Awaited<
  ReturnType<
    PrismaService['workoutTemplate']['findFirst']
  >
> & {
  splits: Array<{
    id: string;
    splitLabel: string;
    days: Array<{
      id: string;
      dayNumber: number;
      label: string;
      exercises: Array<{
        id: string;
        exerciseId: string;
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
      }>;
    }>;
  }>;
};

function splitStyleLabel(splitType: string): string {
  const map: Record<string, string> = {
    PPL: 'Push / Pull / Legs',
    UPPER_LOWER: 'Upper / Lower',
    FULL_BODY: 'Full Body',
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

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    splits: {
      include: {
        days: {
          orderBy: { dayNumber: 'asc' as const },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' as const },
            },
          },
        },
      },
    },
  } as const;

  private async buildExerciseMap(template: WorkoutTemplateWithSplit) {
    const ids = Array.from(
      new Set(
        template.splits.flatMap((split) =>
          split.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId)),
        ),
      ),
    );
    if (ids.length === 0) return new Map<string, TemplateExerciseDto>();
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, primaryMuscle: true },
    });
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }

  private buildListItem(template: WorkoutTemplateWithSplit): TemplateListItemDto {
    const days = template.splits.flatMap((split) =>
      split.days.map((day) => day.label),
    );
    const featured = template.name === 'Upper Lower' || template.name === 'Push Pull Legs';
    const badge =
      template.daysPerWeek >= 6
        ? 'ADVANCED'
        : featured
          ? 'RECOMMENDED'
          : null;

    return {
      id: template.id,
      slug: template.slug,
      name: template.name,
      goal: titleCaseValue(template.goalTags[0] ?? 'MUSCLE_GAIN'),
      level: titleCaseValue(template.experienceTags[0] ?? 'INTERMEDIATE'),
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
          value: titleCaseValue(template.experienceTags[0] ?? 'INTERMEDIATE'),
        },
      ],
    };
  }

  private async buildDetail(template: WorkoutTemplateWithSplit): Promise<TemplateDetailDto> {
    const exerciseById = await this.buildExerciseMap(template);
    const list = this.buildListItem(template);
    const dayCount = template.splits.reduce((sum, split) => sum + split.days.length, 0);

    return {
      ...list,
      description: template.description ?? null,
      goalTags: template.goalTags,
      experienceTags: template.experienceTags,
      splitConfigs: template.splits.map((split) => ({
        id: split.id,
        splitLabel: split.splitLabel,
        days: split.days.map((day) => ({
          dayNumber: day.dayNumber,
          label: day.label,
          exercises: day.exercises.map((exercise) => ({
            orderIndex: exercise.orderIndex,
            setsTarget: exercise.setsTarget,
            repRangeMin: exercise.repRangeMin,
            repRangeMax: exercise.repRangeMax,
            exercise: exerciseById.get(exercise.exerciseId) ?? null,
          })),
        })),
      })),
      programSummary: {
        mesocycleBlocks: 1,
        workoutTemplates: dayCount,
        totalWeeks: 8,
        sessionCount: dayCount * 8,
      },
    };
  }

  async findAll(query: TemplatesQueryDto): Promise<TemplateListItemDto[]> {
    const where: Record<string, unknown> = {};
    if (query.goal) where['goalTags'] = { has: query.goal.toUpperCase() };
    if (query.level) where['experienceTags'] = { has: query.level.toUpperCase() };
    if (query.splitStyle) where['splitType'] = query.splitStyle.toUpperCase();
    if (query.daysPerWeekMin || query.daysPerWeekMax) {
      where['daysPerWeek'] = {};
      if (query.daysPerWeekMin) (where['daysPerWeek'] as Record<string, number>)['gte'] = query.daysPerWeekMin;
      if (query.daysPerWeekMax) (where['daysPerWeek'] as Record<string, number>)['lte'] = query.daysPerWeekMax;
    }
    if (query.search) where['name'] = { contains: query.search, mode: 'insensitive' };

    const records = (await this.prisma.workoutTemplate.findMany({
      where,
      include: this.include,
      orderBy: [{ daysPerWeek: 'asc' }, { name: 'asc' }],
    })) as unknown as WorkoutTemplateWithSplit[];

    return records
      .map((record) => this.buildListItem(record))
      .filter((record) => !query.featuredOnly || record.featured);
  }

  async findOne(idOrSlug: string): Promise<TemplateDetailDto> {
    const record = (await this.prisma.workoutTemplate.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: this.include,
    })) as unknown as WorkoutTemplateWithSplit | null;

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
    const records = (await this.prisma.workoutTemplate.findMany({
      where: { daysPerWeek: { lte: daysAvailable } },
      include: this.include,
      orderBy: [{ daysPerWeek: 'desc' }, { name: 'asc' }],
    })) as unknown as WorkoutTemplateWithSplit[];

    if (records.length === 0) throw new NotFoundException('No templates available');

    const score = (template: WorkoutTemplateWithSplit) => {
      let points = 0;
      if (template.goalTags.includes(goal)) points += 5;
      if (template.experienceTags.includes(level)) points += 4;
      points -= Math.abs(template.daysPerWeek - daysAvailable);
      if (template.name === 'Upper Lower') points += 1;
      return points;
    };

    const sorted = [...records].sort((a, b) => score(b) - score(a));
    const recommended = sorted[0]!;
    const alternatives = sorted.slice(1, 4).map((template) => this.buildListItem(template));

    return {
      recommended: await this.buildDetail(recommended),
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