// src/templates/templates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import {
  ExperienceLevel,
  TrainingGoal,
  SplitStyle,
  MesocycleTemplate,
  WorkoutTemplateDay,
  WorkoutTemplate,
  TemplateSlot,
} from '@prisma/client';

// ── Response shape types ─────────────────────────────────────────

export interface SlotDto {
  order:      number;
  slotLabel:  string;
  sets:       string;   // "3–4"
  reps:       string;   // "8–12"
  rpe:        string;   // "7–9"
}

export interface WorkoutTemplateDto {
  id:           string;
  slug:         string;
  name:         string;
  level:        string;
  primaryMuscle: string;
  slots:        SlotDto[];
}

export interface TemplateDayDto {
  dayNumber:       number;
  label:           string;
  isRestDay:       boolean;
  workoutTemplate: WorkoutTemplateDto | null;
}

export interface TemplateListItemDto {
  id:               string;
  slug:             string;
  name:             string;
  goal:             string;
  level:            string;
  splitStyle:       string;
  splitStyleLabel:  string;
  daysPerWeek:      number;
  durationWeeks:    string;   // "6–8" or "8"
  primaryFocus:     string;
  featured:         boolean;
  badge:            string | null;
  difficultyWarning: string | null;
  progressionType:  string;
  days:             string[];   // flat label list for display
  stats: {
    label: string;
    value: string;
  }[];
}

export interface TemplateDetailDto extends TemplateListItemDto {
  progressionNotes:  string | null;
  deloadWeek:        number | null;
  deloadNotes:       string | null;
  trainingDays:      TemplateDayDto[];
  // What gets created when user initialises this template
  programSummary: {
    mesocycleBlocks:  number;
    workoutTemplates: number;
    totalWeeks:       number;
    sessionCount:     number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────

type MesocycleTemplateWithDays = MesocycleTemplate & {
  days: (WorkoutTemplateDay & {
    workoutTemplate: (WorkoutTemplate & { slots: TemplateSlot[] }) | null;
  })[];
};

function splitStyleLabel(s: SplitStyle): string {
  const map: Record<SplitStyle, string> = {
    PPL:         'Push / Pull / Legs',
    UPPER_LOWER: 'Upper / Lower',
    FULL_BODY:   'Full Body',
    BODY_PART:   'Body Part Split',
    HYBRID:      'Hybrid',
    SPECIALIZED: 'Specialized',
    SPECIALIZATION: 'Specialization',
    LOWER_BIAS: 'Lower Bias',
  };
  return map[s] ?? s;
}

function goalLabel(g: TrainingGoal): string {
  const map: Record<TrainingGoal, string> = {
    HYPERTROPHY:  'Hypertrophy',
    STRENGTH:     'Strength',
    POWERBUILDING: 'Powerbuilding',
    POWERLIFTING:  'Powerlifting',
  };
  return map[g] ?? g;
}

function levelLabel(l: ExperienceLevel): string {
  const map: Record<ExperienceLevel, string> = {
    NOVICE:       'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED:     'Advanced',
  };
  return map[l] ?? l;
}

function durationString(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

function deriveBadge(t: MesocycleTemplate): string | null {
  if (t.daysPerWeek >= 6 || t.level === ExperienceLevel.ADVANCED) return 'ADVANCED';
  if (t.featured) return 'RECOMMENDED';
  return null;
}

function buildStats(t: MesocycleTemplate): { label: string; value: string }[] {
  return [
    { label: 'Sessions',  value: `${t.daysPerWeek}×/week` },
    { label: 'Duration',  value: `${durationString(t.durationWeeksMin, t.durationWeeksMax)} weeks` },
    { label: 'Focus',     value: t.primaryFocus },
    { label: 'Level',     value: levelLabel(t.level) },
  ];
}

function mapSlot(s: TemplateSlot): SlotDto {
  return {
    order:     s.order,
    slotLabel: s.slotLabel,
    sets:      s.setsMin === s.setsMax ? `${s.setsMin}` : `${s.setsMin}–${s.setsMax}`,
    reps:      s.repsMin === s.repsMax ? `${s.repsMin}` : `${s.repsMin}–${s.repsMax}`,
    rpe:       s.rpeMin  === s.rpeMax  ? `${s.rpeMin}`  : `${s.rpeMin}–${s.rpeMax}`,
  };
}

function mapWorkoutTemplate(wt: (WorkoutTemplate & { slots: TemplateSlot[] }) | null): WorkoutTemplateDto | null {
  if (!wt) return null;
  return {
    id:            wt.id,
    slug:          wt.slug,
    name:          wt.name,
    level:         levelLabel(wt.level),
    primaryMuscle: wt.primaryMuscle,
    slots:         wt.slots.sort((a, b) => a.order - b.order).map(mapSlot),
  };
}

function toListItem(t: MesocycleTemplateWithDays): TemplateListItemDto {
  const trainingDays = t.days.filter(d => !d.isRestDay);
  return {
    id:               t.id,
    slug:             t.slug,
    name:             t.name,
    goal:             goalLabel(t.goal),
    level:            levelLabel(t.level),
    splitStyle:       t.splitStyle,
    splitStyleLabel:  splitStyleLabel(t.splitStyle),
    daysPerWeek:      t.daysPerWeek,
    durationWeeks:    durationString(t.durationWeeksMin, t.durationWeeksMax),
    primaryFocus:     t.primaryFocus,
    featured:         t.featured,
    badge:            deriveBadge(t),
    difficultyWarning: t.difficultyWarning,
    progressionType:  t.progressionType,
    days:             trainingDays.map(d => d.label),
    stats:            buildStats(t),
  };
}

function toDetail(t: MesocycleTemplateWithDays): TemplateDetailDto {
  const base = toListItem(t);
  const trainingDayCount = t.days.filter(d => !d.isRestDay).length;
  const totalWeeks = t.durationWeeksMax;
  return {
    ...base,
    progressionNotes: t.progressionNotes,
    deloadWeek:       t.deloadWeek,
    deloadNotes:      t.deloadNotes,
    trainingDays: t.days
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(d => ({
        dayNumber:       d.dayNumber,
        label:           d.label,
        isRestDay:       d.isRestDay,
        workoutTemplate: mapWorkoutTemplate(d.workoutTemplate ?? null),
      })),
    programSummary: {
      mesocycleBlocks:  1,
      workoutTemplates: trainingDayCount,
      totalWeeks,
      sessionCount:     trainingDayCount * totalWeeks,
    },
  };
}

// ── Service ───────────────────────────────────────────────────────

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Shared include clause ────────────────────────────────────────
  private readonly _include = {
    days: {
      include: {
        workoutTemplate: {
          include: { slots: true },
        },
      },
    },
  } as const;

  // ── GET /templates ───────────────────────────────────────────────
  async findAll(query: TemplatesQueryDto): Promise<TemplateListItemDto[]> {
    const where: Record<string, unknown> = {};

    if (query.goal)       where['goal']       = query.goal.toUpperCase();
    if (query.level)      where['level']      = query.level.toUpperCase();
    if (query.splitStyle) where['splitStyle'] = query.splitStyle.toUpperCase();
    if (query.featuredOnly) where['featured'] = true;

    if (query.daysPerWeekMin || query.daysPerWeekMax) {
      where['daysPerWeek'] = {};
      if (query.daysPerWeekMin) (where['daysPerWeek'] as Record<string, number>)['gte'] = query.daysPerWeekMin;
      if (query.daysPerWeekMax) (where['daysPerWeek'] as Record<string, number>)['lte'] = query.daysPerWeekMax;
    }

    if (query.search) {
      where['name'] = { contains: query.search, mode: 'insensitive' };
    }

    const records = await this.prisma.mesocycleTemplate.findMany({
      where,
      include: this._include,
      orderBy: [
        { featured: 'desc' },
        { daysPerWeek: 'asc' },
        { name: 'asc' },
      ],
    });

    return records.map(r => toListItem(r as MesocycleTemplateWithDays));
  }

  // ── GET /templates/:id ───────────────────────────────────────────
  async findOne(id: string): Promise<TemplateDetailDto> {
    const record = await this.prisma.mesocycleTemplate.findFirst({
      where: {
        OR: [{ id }, { slug: id }],   // accept both UUID and slug
      },
      include: this._include,
    });

    if (!record) throw new NotFoundException(`Template "${id}" not found`);
    return toDetail(record as MesocycleTemplateWithDays);
  }

  // ── GET /templates/recommendation ───────────────────────────────
  // Matches template to user profile. Called by MesocyclesService.
  async recommend(
    level: ExperienceLevel,
    goal: TrainingGoal,
    daysAvailable: number,
  ): Promise<{
    recommended: TemplateDetailDto;
    alternatives: TemplateListItemDto[];
    rationale: string;
  }> {
    // Best match: exact goal + level + days fit within daysPerWeek
    const exact = await this.prisma.mesocycleTemplate.findFirst({
      where: { goal, level, daysPerWeek: { lte: daysAvailable } },
      include: this._include,
      orderBy: [{ featured: 'desc' }, { daysPerWeek: 'desc' }],
    });

    // Fallback: same goal, adjacent level
    const fallback = exact ?? await this.prisma.mesocycleTemplate.findFirst({
      where: { goal, daysPerWeek: { lte: daysAvailable } },
      include: this._include,
      orderBy: [{ daysPerWeek: 'desc' }],
    });

    if (!fallback) throw new NotFoundException('No templates available for this profile');

    const alternatives = await this.prisma.mesocycleTemplate.findMany({
      where: {
        goal,
        id: { not: fallback.id },
        daysPerWeek: { lte: daysAvailable },
      },
      include: this._include,
      take: 3,
      orderBy: [{ featured: 'desc' }],
    });

    return {
      recommended:  toDetail(fallback as MesocycleTemplateWithDays),
      alternatives: alternatives.map(a => toListItem(a as MesocycleTemplateWithDays)),
      rationale:    `Matched on goal=${goalLabel(goal)}, level=${levelLabel(level)}, daysAvailable=${daysAvailable}`,
    };
  }

  // ── Expand: used by MesocyclesService.generate() ────────────────
  // Returns the full template detail so generate() can stamp real
  // Workout rows for the user without making another DB round-trip.
  async expand(templateId: string): Promise<TemplateDetailDto> {
    return this.findOne(templateId);
  }
}