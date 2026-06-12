import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateLimitsService } from '../common/template-limits.service';
import { RedisCacheService } from '../common/redis/redis-cache.service';
import { stableQueryHash } from '../common/utils/cache-key.util';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import { resolveRpeTarget } from './rpe.utils';
import { validateTemplateStructure } from './template-validation';

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
    rpeTarget: number;
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

type MesocycleTemplateMeta = {
  durationWeeksMin: number;
  durationWeeksMax: number;
  featured: boolean;
  progressionType: string;
  isPublished?: boolean;
};

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
  mesocycleTemplates?: MesocycleTemplateMeta[];
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
      rpeTarget: number;
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
  if (normalized === 'POWERBUILDING' && tags.includes('POWERBUILDING')) return true;
  if (normalized === 'STRENGTH' && tags.includes('STRENGTH')) return true;
  return false;
}

const FEATURED_SLUGS = new Set(['upper-lower-4x', 'ppl-6x']);
const TEMPLATE_CATALOG_TTL_SECONDS = 60 * 60;

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateLimits: TemplateLimitsService,
    private readonly cache: RedisCacheService,
  ) {}

  async invalidateCatalogCache(): Promise<void> {
    await this.cache.delPattern('catalog:templates:*');
    await this.cache.delPattern('catalog:template:*');
    await this.cache.delPattern('catalog:recommend:*');
  }

  private readonly include = {
    mesocycleTemplates: {
      take: 1,
      select: {
        durationWeeksMin: true,
        durationWeeksMax: true,
        featured: true,
        progressionType: true,
        isPublished: true,
      },
    },
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

  private resolveDurationWeeks(template: SplitTemplateRecord): number {
    const meta = template.mesocycleTemplates?.[0];
    if (meta) return meta.durationWeeksMax;
    return 8;
  }

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
        rpeTarget: exercise.rpeTarget,
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
    const durationWeeks = this.resolveDurationWeeks(template);
    const meta = template.mesocycleTemplates?.[0];
    const featured =
      meta?.featured === true ||
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
      durationWeeks: String(durationWeeks),
      primaryFocus: titleCaseValue(template.primaryMuscle),
      featured,
      badge,
      difficultyWarning: template.daysPerWeek >= 6 ? 'High recovery demand' : null,
      progressionType: 'Progressive overload',
      days,
      stats: [
        { label: 'Sessions', value: `${template.daysPerWeek}x/week` },
        { label: 'Duration', value: `${durationWeeks} weeks` },
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
    const durationWeeks = this.resolveDurationWeeks(template);
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
        totalWeeks: durationWeeks,
        sessionCount: workoutDayCount * durationWeeks,
      },
    };
  }

  async findUserTemplates(userId: string): Promise<TemplateListItemDto[]> {
    const records = (await this.prisma.splitTemplate.findMany({
      where: { userId, isSystem: false },
      include: this.include,
      orderBy: { updatedAt: 'desc' },
    })) as unknown as SplitTemplateRecord[];

    return records.map((record) => ({
      ...this.buildListItem(record),
      featured: false,
      badge: null,
    }));
  }

  async findAll(query: TemplatesQueryDto): Promise<TemplateListItemDto[]> {
    const cacheKey = `catalog:templates:${stableQueryHash(query)}`;
    return this.cache.getOrSet(cacheKey, TEMPLATE_CATALOG_TTL_SECONDS, () =>
      this.loadAll(query),
    );
  }

  private async loadAll(query: TemplatesQueryDto): Promise<TemplateListItemDto[]> {
    const where: Record<string, unknown> = { isSystem: true };
    if (query.goal) {
      const goal = query.goal.toUpperCase();
      where['OR'] = [
        { goalTags: { has: goal } },
        ...(goal === 'MUSCLE_GAIN'
          ? [{ goalTags: { has: 'HYPERTROPHY' } }, { goalTags: { has: 'RECOMPOSITION' } }]
          : []),
        ...(goal === 'POWERBUILDING' ? [{ goalTags: { has: 'STRENGTH' } }] : []),
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
      .filter((record) => {
        const meta = record.mesocycleTemplates?.[0];
        return !meta || meta.isPublished !== false;
      })
      .map((record) => this.buildListItem(record))
      .filter((record) => !query.featuredOnly || record.featured);
  }

  async findOne(idOrSlug: string): Promise<TemplateDetailDto> {
    const cacheKey = `catalog:template:${idOrSlug}`;
    return this.cache.getOrSet(cacheKey, TEMPLATE_CATALOG_TTL_SECONDS, () =>
      this.loadOne(idOrSlug),
    );
  }

  private async loadOne(idOrSlug: string): Promise<TemplateDetailDto> {
    const record = (await this.prisma.splitTemplate.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: this.include,
    })) as unknown as SplitTemplateRecord | null;

    if (!record) throw new NotFoundException(`Template "${idOrSlug}" not found`);
    return this.buildDetail(record);
  }

  async recommendForUser(userId: string, daysAvailable?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { goalMode: true, experienceLevel: true, daysPerWeek: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const goal = (user.goalMode ?? 'MUSCLE_GAIN').toUpperCase();
    const level = (user.experienceLevel ?? 'INTERMEDIATE').toUpperCase();
    const days = daysAvailable ?? user.daysPerWeek ?? 4;

    return this.recommend(goal, level, days);
  }

  async recommend(goal: string, level: string, daysAvailable: number) {
    const cacheKey = `catalog:recommend:${goal.toUpperCase()}:${level.toUpperCase()}:${daysAvailable}`;
    return this.cache.getOrSet(cacheKey, TEMPLATE_CATALOG_TTL_SECONDS, () =>
      this.loadRecommendation(goal, level, daysAvailable),
    );
  }

  private async loadRecommendation(goal: string, level: string, daysAvailable: number) {
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

  async resolveUniqueSplitTemplateName(baseName: string): Promise<string> {
    const trimmed = baseName.trim() || 'Custom Program';
    let candidate = trimmed;
    let suffix = 2;
    while (await this.prisma.splitTemplate.findUnique({ where: { name: candidate } })) {
      candidate = `${trimmed} (${suffix})`;
      suffix += 1;
    }
    return candidate;
  }

  async forkTemplate(userId: string, templateId: string): Promise<TemplateDetailDto> {
    await this.templateLimits.assertCanCreate(userId);

    const source = await this.prisma.splitTemplate.findFirst({
      where: {
        OR: [{ id: templateId }, { slug: templateId }],
        isSystem: true,
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`System template "${templateId}" not found`);
    }

    const forkSlug = `${source.slug ?? source.id}-fork-${userId.slice(0, 8)}-${Date.now()}`;
    const forkName = await this.resolveUniqueSplitTemplateName(`${source.name} (My Copy)`);

    const forked = await this.prisma.splitTemplate.create({
      data: {
        userId,
        slug: forkSlug,
        name: forkName,
        level: source.level,
        goal: source.goal,
        primaryMuscle: source.primaryMuscle,
        isSystem: false,
        splitLabel: source.splitLabel,
        splitType: source.splitType,
        daysPerWeek: source.daysPerWeek,
        description: source.description,
        goalTags: source.goalTags,
        experienceTags: source.experienceTags,
        days: {
          create: source.days.map((day) => ({
            dayNumber: day.dayNumber,
            dayType: day.dayType,
            label: day.label,
            exercises: {
              create: day.exercises.map((exercise) => ({
                exerciseId: exercise.exerciseId,
                orderIndex: exercise.orderIndex,
                setsTarget: exercise.setsTarget,
                repRangeMin: exercise.repRangeMin,
                repRangeMax: exercise.repRangeMax,
                rpeTarget: exercise.rpeTarget,
              })),
            },
          })),
        },
      },
    });

    return this.findOne(forked.id);
  }

  private async assertUserOwnedTemplate(userId: string, templateId: string) {
    const record = await this.prisma.splitTemplate.findFirst({
      where: { id: templateId, userId, isSystem: false },
      include: this.include,
    });
    if (!record) {
      throw new ForbiddenException('You can only edit your own custom templates');
    }
    return record as unknown as SplitTemplateRecord;
  }

  async validateOwnedTemplate(userId: string, templateId: string) {
    const record = await this.assertUserOwnedTemplate(userId, templateId);
    const days = record.days.map((day) => ({
      dayNumber: day.dayNumber,
      dayType: day.dayType,
      label: day.label,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        setsTarget: exercise.setsTarget,
        repRangeMin: exercise.repRangeMin,
        repRangeMax: exercise.repRangeMax,
        rpeTarget: exercise.rpeTarget,
      })),
    }));
    return validateTemplateStructure({
      daysPerWeek: record.daysPerWeek,
      days,
      goal: record.goal,
    });
  }

  private validateScratchSchedule(
    daysPerWeek: number,
    days?: Array<{ dayNumber: number; dayType: 'WORKOUT' | 'REST'; label: string }>,
  ): Array<{ dayNumber: number; dayType: 'WORKOUT' | 'REST'; label: string }> {
    if (!days) {
      return Array.from({ length: 7 }, (_, index) => {
        const dayNumber = index + 1;
        const isWorkout = dayNumber <= daysPerWeek;
        return {
          dayNumber,
          dayType: isWorkout ? 'WORKOUT' as const : 'REST' as const,
          label: isWorkout ? `Day ${dayNumber}` : 'Rest',
        };
      });
    }

    if (days.length !== 7) {
      throw new BadRequestException('Schedule must include exactly 7 days');
    }
    const dayNumbers = new Set(days.map((d) => d.dayNumber));
    if (dayNumbers.size !== 7 || [...dayNumbers].some((n) => n < 1 || n > 7)) {
      throw new BadRequestException('Schedule dayNumber values must be unique integers from 1 to 7');
    }
    const workoutCount = days.filter((d) => d.dayType === 'WORKOUT').length;
    if (workoutCount !== daysPerWeek) {
      throw new BadRequestException(
        `Workout day count (${workoutCount}) must match daysPerWeek (${daysPerWeek})`,
      );
    }
    return days.map((day) => ({
      dayNumber: day.dayNumber,
      dayType: day.dayType,
      label: day.label?.trim() || (day.dayType === 'WORKOUT' ? `Day ${day.dayNumber}` : 'Rest'),
    }));
  }

  async createScratch(
    userId: string,
    body?: {
      name?: string;
      daysPerWeek?: number;
      days?: Array<{ dayNumber: number; dayType: 'WORKOUT' | 'REST'; label: string }>;
    },
  ): Promise<TemplateDetailDto> {
    await this.templateLimits.assertCanCreate(userId);

    const daysPerWeek = body?.daysPerWeek ?? 3;
    const scheduleDays = this.validateScratchSchedule(daysPerWeek, body?.days);
    const slug = `scratch-${userId.slice(0, 8)}-${Date.now()}`;
    const name = await this.resolveUniqueSplitTemplateName(body?.name ?? 'Custom Program');
    const created = await this.prisma.splitTemplate.create({
      data: {
        userId,
        slug,
        name,
        level: 'INTERMEDIATE',
        goal: 'HYPERTROPHY',
        primaryMuscle: 'Balanced',
        isSystem: false,
        splitLabel: 'Custom',
        splitType: 'FULL_BODY',
        daysPerWeek,
        description: 'Custom program created from scratch',
        goalTags: ['HYPERTROPHY'],
        experienceTags: ['INTERMEDIATE'],
        days: {
          create: scheduleDays.map((day) => ({
            dayNumber: day.dayNumber,
            dayType: day.dayType,
            label: day.label,
          })),
        },
      },
    });
    return this.findOne(created.id);
  }

  async updateMetadata(
    userId: string,
    templateId: string,
    body: {
      name?: string;
      description?: string;
      daysPerWeek?: number;
      splitType?: string;
      level?: string;
      goal?: string;
    },
  ): Promise<TemplateDetailDto> {
    await this.assertUserOwnedTemplate(userId, templateId);
    await this.prisma.splitTemplate.update({
      where: { id: templateId },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.daysPerWeek !== undefined ? { daysPerWeek: body.daysPerWeek } : {}),
        ...(body.splitType !== undefined ? { splitType: body.splitType } : {}),
        ...(body.level !== undefined ? { level: body.level as any } : {}),
        ...(body.goal !== undefined ? { goal: body.goal as any } : {}),
      },
    });
    return this.findOne(templateId);
  }

  async replaceDays(
    userId: string,
    templateId: string,
    days: Array<{
      id?: string;
      dayNumber: number;
      dayType: 'WORKOUT' | 'REST';
      label: string;
      exercises?: Array<{
        id?: string;
        exerciseId: string;
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
        rpeTarget?: number;
      }>;
    }>,
  ): Promise<TemplateDetailDto> {
    await this.assertUserOwnedTemplate(userId, templateId);
    const existingDays = await this.prisma.splitDay.findMany({
      where: { splitTemplateId: templateId },
      select: { id: true },
    });
    const existingDayIds = existingDays.map((d) => d.id);
    if (existingDayIds.length > 0) {
      await this.prisma.splitDayExercise.deleteMany({
        where: { splitDayId: { in: existingDayIds } },
      });
      await this.prisma.splitDay.deleteMany({ where: { splitTemplateId: templateId } });
    }

    const workoutCount = days.filter((d) => d.dayType === 'WORKOUT').length;
    await this.prisma.splitTemplate.update({
      where: { id: templateId },
      data: {
        daysPerWeek: workoutCount,
        days: {
          create: days.map((day) => ({
            dayNumber: day.dayNumber,
            dayType: day.dayType,
            label: day.label,
            ...(day.dayType === 'WORKOUT'
              ? {
                  exercises: {
                    create: (day.exercises ?? []).map((slot, index) => ({
                      exerciseId: slot.exerciseId,
                      orderIndex: slot.orderIndex ?? index + 1,
                      setsTarget: slot.setsTarget,
                      repRangeMin: slot.repRangeMin,
                      repRangeMax: slot.repRangeMax,
                      rpeTarget: resolveRpeTarget(
                        slot.repRangeMin,
                        slot.repRangeMax,
                        slot.rpeTarget,
                      ),
                    })),
                  },
                }
              : {}),
          })),
        },
      },
    });

    const errors = await this.validateOwnedTemplate(userId, templateId);
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Template structure is invalid', errors });
    }
    return this.findOne(templateId);
  }

  async deleteUserTemplate(userId: string, templateId: string) {
    await this.assertUserOwnedTemplate(userId, templateId);

    const mesocycleCount = await this.prisma.mesocycle.count({
      where: { splitTemplateId: templateId },
    });
    if (mesocycleCount > 0) {
      throw new BadRequestException(
        'Cannot delete a program that is linked to a training block.',
      );
    }

    const days = await this.prisma.splitDay.findMany({
      where: { splitTemplateId: templateId },
      select: { id: true },
    });
    const dayIds = days.map((d) => d.id);
    if (dayIds.length > 0) {
      await this.prisma.splitDayExercise.deleteMany({
        where: { splitDayId: { in: dayIds } },
      });
      await this.prisma.splitDay.deleteMany({ where: { splitTemplateId: templateId } });
    }

    await this.prisma.splitTemplate.delete({ where: { id: templateId } });
    return { deleted: true };
  }

  async validateTemplate(userId: string, templateId: string) {
    const template = await this.prisma.splitTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ isSystem: true }, { userId }],
      },
      include: this.include,
    });
    if (!template) throw new NotFoundException(`Template "${templateId}" not found`);
    const record = template as unknown as SplitTemplateRecord;
    const errors = validateTemplateStructure({
      daysPerWeek: record.daysPerWeek,
      goal: record.goal,
      days: record.days.map((day) => ({
        dayNumber: day.dayNumber,
        dayType: day.dayType,
        label: day.label,
        exercises: day.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          setsTarget: exercise.setsTarget,
          repRangeMin: exercise.repRangeMin,
          repRangeMax: exercise.repRangeMax,
          rpeTarget: exercise.rpeTarget,
        })),
      })),
    });
    return { valid: errors.length === 0, errors };
  }

  async assertSystemTemplate(templateId: string) {
    const template = await this.prisma.splitTemplate.findFirst({
      where: { id: templateId, isSystem: true },
    });
    if (!template) {
      throw new NotFoundException(`System template "${templateId}" not found`);
    }
    return template;
  }

  async updateSystemMetadata(
    templateId: string,
    body: {
      name?: string;
      description?: string;
      daysPerWeek?: number;
      splitType?: string;
      level?: string;
      goal?: string;
      goalTags?: string[];
      experienceTags?: string[];
    },
  ): Promise<TemplateDetailDto> {
    await this.assertSystemTemplate(templateId);
    await this.prisma.splitTemplate.update({
      where: { id: templateId },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.daysPerWeek !== undefined ? { daysPerWeek: body.daysPerWeek } : {}),
        ...(body.splitType !== undefined ? { splitType: body.splitType } : {}),
        ...(body.level !== undefined ? { level: body.level as any } : {}),
        ...(body.goal !== undefined ? { goal: body.goal as any } : {}),
        ...(body.goalTags !== undefined ? { goalTags: body.goalTags } : {}),
        ...(body.experienceTags !== undefined ? { experienceTags: body.experienceTags } : {}),
      },
    });
    return this.findOne(templateId);
  }

  async replaceSystemDays(
    templateId: string,
    days: Array<{
      dayNumber: number;
      dayType: 'WORKOUT' | 'REST';
      label: string;
      exercises?: Array<{
        exerciseId: string;
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
        rpeTarget?: number;
      }>;
    }>,
  ): Promise<TemplateDetailDto> {
    await this.assertSystemTemplate(templateId);
    const existingDays = await this.prisma.splitDay.findMany({
      where: { splitTemplateId: templateId },
      select: { id: true },
    });
    const existingDayIds = existingDays.map((d) => d.id);
    if (existingDayIds.length > 0) {
      await this.prisma.splitDayExercise.deleteMany({
        where: { splitDayId: { in: existingDayIds } },
      });
      await this.prisma.splitDay.deleteMany({ where: { splitTemplateId: templateId } });
    }

    const workoutCount = days.filter((d) => d.dayType === 'WORKOUT').length;
    await this.prisma.splitTemplate.update({
      where: { id: templateId },
      data: {
        daysPerWeek: workoutCount,
        days: {
          create: days.map((day) => ({
            dayNumber: day.dayNumber,
            dayType: day.dayType,
            label: day.label,
            ...(day.dayType === 'WORKOUT'
              ? {
                  exercises: {
                    create: (day.exercises ?? []).map((slot, index) => ({
                      exerciseId: slot.exerciseId,
                      orderIndex: slot.orderIndex ?? index + 1,
                      setsTarget: slot.setsTarget,
                      repRangeMin: slot.repRangeMin,
                      repRangeMax: slot.repRangeMax,
                      rpeTarget: resolveRpeTarget(
                        slot.repRangeMin,
                        slot.repRangeMax,
                        slot.rpeTarget,
                      ),
                    })),
                  },
                }
              : {}),
          })),
        },
      },
    });

    const record = (await this.prisma.splitTemplate.findFirst({
      where: { id: templateId },
      include: this.include,
    })) as unknown as SplitTemplateRecord;
    const errors = validateTemplateStructure({
      daysPerWeek: record.daysPerWeek,
      goal: record.goal,
      days: record.days.map((day) => ({
        dayNumber: day.dayNumber,
        dayType: day.dayType,
        label: day.label,
        exercises: day.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          setsTarget: exercise.setsTarget,
          repRangeMin: exercise.repRangeMin,
          repRangeMax: exercise.repRangeMax,
          rpeTarget: exercise.rpeTarget,
        })),
      })),
    });
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Template structure is invalid', errors });
    }
    return this.findOne(templateId);
  }
}
