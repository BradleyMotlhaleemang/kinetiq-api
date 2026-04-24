// prisma/seeds/templates.seed.ts
// Run via: npx ts-node prisma/seeds/templates.seed.ts
// Or call seedTemplates() from your main prisma/seed.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, ExperienceLevel, TrainingGoal, SplitStyle } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter } as any);

// ================================================================
// WORKOUT TEMPLATE DEFINITIONS
// Source of truth: YAML dataset provided — do not edit field values
// without updating the YAML accordingly.
// ================================================================

const WORKOUT_TEMPLATES = [
  {
    slug: 'WT-PUSH-B',
    name: 'Push Day Beginner',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Push',
    splitType: SplitStyle.PPL,
    daysPerWeek: 6,
    slots: [
      { order: 1, slotLabel: 'Horizontal Press',  setsMin: 3, setsMax: 3, repsMin: 8,  repsMax: 12, rpeMin: 6, rpeMax: 8 },
      { order: 2, slotLabel: 'Overhead Press',    setsMin: 3, setsMax: 3, repsMin: 8,  repsMax: 12, rpeMin: 6, rpeMax: 8 },
      { order: 3, slotLabel: 'Triceps Isolation', setsMin: 2, setsMax: 2, repsMin: 10, repsMax: 15, rpeMin: 7, rpeMax: 9 },
    ],
  },
  {
    slug: 'WT-PUSH-I',
    name: 'Push Day Intermediate',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Push',
    splitType: SplitStyle.PPL,
    daysPerWeek: 6,
    slots: [
      { order: 1, slotLabel: 'Heavy Bench',       setsMin: 4, setsMax: 4, repsMin: 5,  repsMax: 8,  rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Incline Press',     setsMin: 3, setsMax: 4, repsMin: 8,  repsMax: 12, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Lateral Raise',     setsMin: 3, setsMax: 3, repsMin: 12, repsMax: 20, rpeMin: 8, rpeMax: 10 },
      { order: 4, slotLabel: 'Triceps Extension', setsMin: 3, setsMax: 3, repsMin: 10, repsMax: 15, rpeMin: 8, rpeMax: 10 },
    ],
  },
  {
    slug: 'WT-PULL-B',
    name: 'Pull Day Beginner',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Back',
    splitType: SplitStyle.PPL,
    daysPerWeek: 6,
    slots: [
      { order: 1, slotLabel: 'Row',            setsMin: 3, setsMax: 3, repsMin: 8,  repsMax: 12, rpeMin: 6, rpeMax: 8 },
      { order: 2, slotLabel: 'Vertical Pull',  setsMin: 3, setsMax: 3, repsMin: 8,  repsMax: 12, rpeMin: 6, rpeMax: 8 },
      { order: 3, slotLabel: 'Biceps',         setsMin: 2, setsMax: 2, repsMin: 10, repsMax: 15, rpeMin: 7, rpeMax: 9 },
    ],
  },
  {
    slug: 'WT-PULL-I',
    name: 'Pull Day Intermediate',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Back',
    splitType: SplitStyle.PPL,
    daysPerWeek: 6,
    slots: [
      { order: 1, slotLabel: 'Heavy Row',    setsMin: 4, setsMax: 4, repsMin: 6,  repsMax: 8,  rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Lat Pulldown', setsMin: 3, setsMax: 4, repsMin: 8,  repsMax: 12, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Rear Delt',    setsMin: 3, setsMax: 3, repsMin: 12, repsMax: 15, rpeMin: 8, rpeMax: 10 },
    ],
  },
  {
    slug: 'WT-LEGS-B',
    name: 'Legs Beginner',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Legs',
    splitType: SplitStyle.PPL,
    daysPerWeek: 6,
    slots: [
      { order: 1, slotLabel: 'Squat Pattern', setsMin: 3, setsMax: 3, repsMin: 8,  repsMax: 12, rpeMin: 6, rpeMax: 8 },
      { order: 2, slotLabel: 'Hinge',         setsMin: 3, setsMax: 3, repsMin: 8,  repsMax: 12, rpeMin: 6, rpeMax: 8 },
      { order: 3, slotLabel: 'Isolation',     setsMin: 2, setsMax: 2, repsMin: 12, repsMax: 15, rpeMin: 7, rpeMax: 9 },
    ],
  },
  {
    slug: 'WT-LEGS-I',
    name: 'Legs Intermediate',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Legs',
    splitType: SplitStyle.PPL,
    daysPerWeek: 6,
    slots: [
      { order: 1, slotLabel: 'Heavy Squat', setsMin: 4, setsMax: 4, repsMin: 5,  repsMax: 8,  rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'RDL',         setsMin: 3, setsMax: 4, repsMin: 6,  repsMax: 10, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Leg Curl',    setsMin: 3, setsMax: 3, repsMin: 10, repsMax: 15, rpeMin: 8, rpeMax: 10 },
    ],
  },
  {
    slug: 'WT-UPPER',
    name: 'Upper Body General',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    primaryMuscle: 'Upper',
    splitType: SplitStyle.UPPER_LOWER,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Push Compound', setsMin: 3, setsMax: 4, repsMin: 6,  repsMax: 10, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Pull Compound', setsMin: 3, setsMax: 4, repsMin: 6,  repsMax: 10, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Arms',          setsMin: 3, setsMax: 3, repsMin: 10, repsMax: 15, rpeMin: 8, rpeMax: 10 },
    ],
  },
  // ── Strength / Powerlifting generic templates ──────────────────
  {
    slug: 'WT-SBD-SQUAT',
    name: 'Squat Focus',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.STRENGTH,
    primaryMuscle: 'Legs',
    splitType: SplitStyle.SPECIALIZED,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Competition Squat', setsMin: 3, setsMax: 5, repsMin: 3, repsMax: 5, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Squat Variation',   setsMin: 3, setsMax: 3, repsMin: 5, repsMax: 8, rpeMin: 7, rpeMax: 8 },
      { order: 3, slotLabel: 'Accessories',       setsMin: 2, setsMax: 3, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 8 },
    ],
  },
  {
    slug: 'WT-SBD-BENCH',
    name: 'Bench Focus',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.STRENGTH,
    primaryMuscle: 'Push',
    splitType: SplitStyle.SPECIALIZED,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Competition Bench', setsMin: 3, setsMax: 5, repsMin: 3, repsMax: 5, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Bench Variation',   setsMin: 3, setsMax: 3, repsMin: 5, repsMax: 8, rpeMin: 7, rpeMax: 8 },
      { order: 3, slotLabel: 'Triceps',           setsMin: 2, setsMax: 3, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 8 },
    ],
  },
  {
    slug: 'WT-SBD-DEADLIFT',
    name: 'Deadlift Focus',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.STRENGTH,
    primaryMuscle: 'Back',
    splitType: SplitStyle.SPECIALIZED,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Competition Deadlift', setsMin: 3, setsMax: 5, repsMin: 2, repsMax: 5, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Deadlift Variation',   setsMin: 3, setsMax: 3, repsMin: 4, repsMax: 6, rpeMin: 7, rpeMax: 8 },
      { order: 3, slotLabel: 'Back Accessories',     setsMin: 2, setsMax: 3, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 8 },
    ],
  },
  {
    slug: 'WT-SBD-ACCESSORIES',
    name: 'Accessories Day',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.STRENGTH,
    primaryMuscle: 'Full Body',
    splitType: SplitStyle.SPECIALIZED,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Upper Accessory',  setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 15, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Lower Accessory',  setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 15, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Core',             setsMin: 2, setsMax: 3, repsMin: 10, repsMax: 15, rpeMin: 6, rpeMax: 8 },
    ],
  },
  {
    slug: 'WT-UPPER-STR',
    name: 'Upper Strength',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.POWERBUILDING,
    primaryMuscle: 'Upper',
    splitType: SplitStyle.UPPER_LOWER,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Heavy Press',   setsMin: 4, setsMax: 5, repsMin: 3, repsMax: 5,  rpeMin: 8, rpeMax: 9 },
      { order: 2, slotLabel: 'Heavy Row',     setsMin: 4, setsMax: 4, repsMin: 4, repsMax: 6,  rpeMin: 8, rpeMax: 9 },
      { order: 3, slotLabel: 'Triceps',       setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 9 },
    ],
  },
  {
    slug: 'WT-LOWER-STR',
    name: 'Lower Strength',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.POWERBUILDING,
    primaryMuscle: 'Legs',
    splitType: SplitStyle.UPPER_LOWER,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Heavy Squat',   setsMin: 4, setsMax: 5, repsMin: 3, repsMax: 5, rpeMin: 8, rpeMax: 9 },
      { order: 2, slotLabel: 'Heavy Hinge',   setsMin: 3, setsMax: 4, repsMin: 3, repsMax: 5, rpeMin: 8, rpeMax: 9 },
      { order: 3, slotLabel: 'Leg Isolation', setsMin: 2, setsMax: 3, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 8 },
    ],
  },
  {
    slug: 'WT-UPPER-HYP',
    name: 'Upper Hypertrophy',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.POWERBUILDING,
    primaryMuscle: 'Upper',
    splitType: SplitStyle.UPPER_LOWER,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Volume Press',  setsMin: 4, setsMax: 4, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Volume Pull',   setsMin: 4, setsMax: 4, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Arm Volume',    setsMin: 3, setsMax: 4, repsMin: 10, repsMax: 15, rpeMin: 8, rpeMax: 10 },
    ],
  },
  {
    slug: 'WT-LOWER-HYP',
    name: 'Lower Hypertrophy',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.POWERBUILDING,
    primaryMuscle: 'Legs',
    splitType: SplitStyle.UPPER_LOWER,
    daysPerWeek: 4,
    slots: [
      { order: 1, slotLabel: 'Squat Volume',   setsMin: 4, setsMax: 4, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 9 },
      { order: 2, slotLabel: 'Hinge Volume',   setsMin: 3, setsMax: 4, repsMin: 8, repsMax: 12, rpeMin: 7, rpeMax: 9 },
      { order: 3, slotLabel: 'Leg Curl',       setsMin: 3, setsMax: 3, repsMin: 12, repsMax: 15, rpeMin: 8, rpeMax: 10 },
    ],
  },
] as const;

type TemplateDaySeed = {
  dayNumber: number;
  label: string;
  isRestDay: boolean;
  workoutSlug: string | null;
};

type NewTemplateInput = {
  slug: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  goal: 'Hypertrophy' | 'Strength' | 'Powerbuilding' | 'Powerlifting';
  splitStyle: 'FULL_BODY' | 'UPPER_LOWER' | 'LOWER_BIAS' | 'SPECIALIZATION';
  durationWeeksMin: number;
  durationWeeksMax: number;
  daysPerWeek: number;
  difficultyWarning: string | null;
  featured: boolean;
  primaryFocus: string;
  split: Record<string, string>;
};

function mapLevel(level: NewTemplateInput['level']): ExperienceLevel {
  if (level === 'Beginner') return ExperienceLevel.NOVICE;
  if (level === 'Intermediate') return ExperienceLevel.INTERMEDIATE;
  return ExperienceLevel.ADVANCED;
}

function mapGoal(goal: NewTemplateInput['goal']): TrainingGoal {
  if (goal === 'Strength') return TrainingGoal.STRENGTH;
  if (goal === 'Powerbuilding') return TrainingGoal.POWERBUILDING;
  if (goal === 'Powerlifting') return TrainingGoal.POWERLIFTING;
  return TrainingGoal.HYPERTROPHY;
}

function mapSplitStyle(style: NewTemplateInput['splitStyle']): SplitStyle {
  if (style === 'LOWER_BIAS') return SplitStyle.LOWER_BIAS;
  if (style === 'SPECIALIZATION') return SplitStyle.SPECIALIZATION;
  if (style === 'UPPER_LOWER') return SplitStyle.UPPER_LOWER;
  return SplitStyle.FULL_BODY;
}

function resolveWorkoutSlug(label: string, level: ExperienceLevel): string | null {
  const normalized = label.toLowerCase();
  if (normalized.includes('rest')) return null;
  if (normalized.includes('pull') || normalized.includes('back')) {
    return level === ExperienceLevel.NOVICE ? 'WT-PULL-B' : 'WT-PULL-I';
  }
  if (
    normalized.includes('leg') ||
    normalized.includes('lower') ||
    normalized.includes('quad') ||
    normalized.includes('glute')
  ) {
    return level === ExperienceLevel.NOVICE ? 'WT-LEGS-B' : 'WT-LEGS-I';
  }
  if (
    normalized.includes('push') ||
    normalized.includes('chest') ||
    normalized.includes('shoulder')
  ) {
    return level === ExperienceLevel.NOVICE ? 'WT-PUSH-B' : 'WT-PUSH-I';
  }
  if (normalized.includes('arm') || normalized.includes('upper') || normalized.includes('full')) {
    return 'WT-UPPER';
  }
  return 'WT-UPPER';
}

type MesocycleTemplateSeed = {
  slug: string;
  name: string;
  level: ExperienceLevel;
  goal: TrainingGoal;
  splitStyle: SplitStyle;
  primaryFocus: string;
  durationWeeksMin: number;
  durationWeeksMax: number;
  daysPerWeek: number;
  progressionType: string;
  progressionNotes?: string;
  deloadWeek?: number;
  deloadNotes?: string;
  difficultyWarning?: string;
  featured: boolean;
  days: TemplateDaySeed[];
};

const MESOCYCLE_TEMPLATES: MesocycleTemplateSeed[] = [
  {
    slug: 'MC-016',
    name: 'PPL - 3 Day',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.HYPERTROPHY,
    splitStyle: SplitStyle.PPL,
    primaryFocus: 'Balanced',
    durationWeeksMin: 6,
    durationWeeksMax: 8,
    daysPerWeek: 3,
    progressionType: 'RPE-based',
    progressionNotes: 'Add reps before load',
    deloadNotes: 'Reduce sets in final week',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Push', isRestDay: false, workoutSlug: 'WT-PUSH-B' },
      { dayNumber: 2, label: 'Pull', isRestDay: false, workoutSlug: 'WT-PULL-B' },
      { dayNumber: 3, label: 'Legs', isRestDay: false, workoutSlug: 'WT-LEGS-B' },
      { dayNumber: 4, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 5, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-017',
    name: 'PPL - 6 Day',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    splitStyle: SplitStyle.PPL,
    primaryFocus: 'Balanced',
    durationWeeksMin: 8,
    durationWeeksMax: 8,
    daysPerWeek: 6,
    progressionType: 'RPE-based',
    progressionNotes: 'Increase load weekly',
    deloadWeek: 8,
    featured: true,
    days: [
      { dayNumber: 1, label: 'Push (A)', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 2, label: 'Pull (A)', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 3, label: 'Legs (A)', isRestDay: false, workoutSlug: 'WT-LEGS-I' },
      { dayNumber: 4, label: 'Push (B)', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 5, label: 'Pull (B)', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 6, label: 'Legs (B)', isRestDay: false, workoutSlug: 'WT-LEGS-I' },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-018',
    name: 'PPL - 6 Day Specialization',
    level: ExperienceLevel.ADVANCED,
    goal: TrainingGoal.HYPERTROPHY,
    splitStyle: SplitStyle.SPECIALIZED,
    primaryFocus: 'Weak Point Focus',
    durationWeeksMin: 8,
    durationWeeksMax: 10,
    daysPerWeek: 6,
    progressionType: 'RPE-based',
    difficultyWarning: 'Very high fatigue',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Push (Chest Bias)', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 2, label: 'Pull (Back Bias)', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 3, label: 'Legs', isRestDay: false, workoutSlug: 'WT-LEGS-I' },
      { dayNumber: 4, label: 'Push (Volume)', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 5, label: 'Pull (Volume)', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 6, label: 'Legs (Volume)', isRestDay: false, workoutSlug: 'WT-LEGS-I' },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-019',
    name: 'Bodybuilding - 5 Day',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.HYPERTROPHY,
    splitStyle: SplitStyle.BODY_PART,
    primaryFocus: 'Aesthetics',
    durationWeeksMin: 8,
    durationWeeksMax: 8,
    daysPerWeek: 5,
    progressionType: 'RPE-based',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Chest', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 2, label: 'Back', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 3, label: 'Shoulders', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 4, label: 'Legs', isRestDay: false, workoutSlug: 'WT-LEGS-I' },
      { dayNumber: 5, label: 'Arms', isRestDay: false, workoutSlug: 'WT-UPPER' },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-020',
    name: 'Bodybuilding - 6 Day Advanced',
    level: ExperienceLevel.ADVANCED,
    goal: TrainingGoal.HYPERTROPHY,
    splitStyle: SplitStyle.BODY_PART,
    primaryFocus: 'Aesthetics',
    durationWeeksMin: 8,
    durationWeeksMax: 10,
    daysPerWeek: 6,
    progressionType: 'RPE-based',
    difficultyWarning: 'High recovery required',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Chest', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 2, label: 'Back', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 3, label: 'Legs', isRestDay: false, workoutSlug: 'WT-LEGS-I' },
      { dayNumber: 4, label: 'Shoulders', isRestDay: false, workoutSlug: 'WT-PUSH-I' },
      { dayNumber: 5, label: 'Arms', isRestDay: false, workoutSlug: 'WT-UPPER' },
      { dayNumber: 6, label: 'Weak Point', isRestDay: false, workoutSlug: 'WT-UPPER' },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-021',
    name: 'Powerbuilding - 4 Day',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.POWERBUILDING,
    splitStyle: SplitStyle.UPPER_LOWER,
    primaryFocus: 'Strength + Hypertrophy',
    durationWeeksMin: 8,
    durationWeeksMax: 8,
    daysPerWeek: 4,
    progressionType: 'RPE-based',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Upper Strength', isRestDay: false, workoutSlug: 'WT-UPPER-STR' },
      { dayNumber: 2, label: 'Lower Strength', isRestDay: false, workoutSlug: 'WT-LOWER-STR' },
      { dayNumber: 3, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 4, label: 'Upper Hypertrophy', isRestDay: false, workoutSlug: 'WT-UPPER-HYP' },
      { dayNumber: 5, label: 'Lower Hypertrophy', isRestDay: false, workoutSlug: 'WT-LOWER-HYP' },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-022',
    name: 'Powerbuilding - 5 Day',
    level: ExperienceLevel.ADVANCED,
    goal: TrainingGoal.POWERBUILDING,
    splitStyle: SplitStyle.HYBRID,
    primaryFocus: 'Strength + Size',
    durationWeeksMin: 8,
    durationWeeksMax: 10,
    daysPerWeek: 5,
    progressionType: 'RPE-based',
    difficultyWarning: 'High CNS fatigue',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Bench Focus', isRestDay: false, workoutSlug: 'WT-UPPER-STR' },
      { dayNumber: 2, label: 'Squat Focus', isRestDay: false, workoutSlug: 'WT-LOWER-STR' },
      { dayNumber: 3, label: 'Pull', isRestDay: false, workoutSlug: 'WT-PULL-I' },
      { dayNumber: 4, label: 'Hypertrophy Upper', isRestDay: false, workoutSlug: 'WT-UPPER-HYP' },
      { dayNumber: 5, label: 'Hypertrophy Lower', isRestDay: false, workoutSlug: 'WT-LOWER-HYP' },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-023',
    name: 'Powerlifting - 3 Day',
    level: ExperienceLevel.NOVICE,
    goal: TrainingGoal.STRENGTH,
    splitStyle: SplitStyle.FULL_BODY,
    primaryFocus: 'SBD',
    durationWeeksMin: 6,
    durationWeeksMax: 8,
    daysPerWeek: 3,
    progressionType: 'RPE-based',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Squat Focus', isRestDay: false, workoutSlug: 'WT-SBD-SQUAT' },
      { dayNumber: 2, label: 'Bench Focus', isRestDay: false, workoutSlug: 'WT-SBD-BENCH' },
      { dayNumber: 3, label: 'Deadlift Focus', isRestDay: false, workoutSlug: 'WT-SBD-DEADLIFT' },
      { dayNumber: 4, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 5, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-024',
    name: 'Powerlifting - 4 Day',
    level: ExperienceLevel.INTERMEDIATE,
    goal: TrainingGoal.STRENGTH,
    splitStyle: SplitStyle.UPPER_LOWER,
    primaryFocus: 'SBD',
    durationWeeksMin: 8,
    durationWeeksMax: 8,
    daysPerWeek: 4,
    progressionType: 'RPE-based',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Squat', isRestDay: false, workoutSlug: 'WT-SBD-SQUAT' },
      { dayNumber: 2, label: 'Bench', isRestDay: false, workoutSlug: 'WT-SBD-BENCH' },
      { dayNumber: 3, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 4, label: 'Deadlift', isRestDay: false, workoutSlug: 'WT-SBD-DEADLIFT' },
      { dayNumber: 5, label: 'Accessories', isRestDay: false, workoutSlug: 'WT-SBD-ACCESSORIES' },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
  {
    slug: 'MC-025',
    name: 'Powerlifting - 5 Day Advanced',
    level: ExperienceLevel.ADVANCED,
    goal: TrainingGoal.STRENGTH,
    splitStyle: SplitStyle.SPECIALIZED,
    primaryFocus: 'SBD',
    durationWeeksMin: 8,
    durationWeeksMax: 10,
    daysPerWeek: 5,
    progressionType: 'RPE-based',
    difficultyWarning: 'CNS intensive',
    featured: false,
    days: [
      { dayNumber: 1, label: 'Heavy Squat', isRestDay: false, workoutSlug: 'WT-SBD-SQUAT' },
      { dayNumber: 2, label: 'Bench Volume', isRestDay: false, workoutSlug: 'WT-SBD-BENCH' },
      { dayNumber: 3, label: 'Deadlift Heavy', isRestDay: false, workoutSlug: 'WT-SBD-DEADLIFT' },
      { dayNumber: 4, label: 'Bench Heavy', isRestDay: false, workoutSlug: 'WT-SBD-BENCH' },
      { dayNumber: 5, label: 'Accessories', isRestDay: false, workoutSlug: 'WT-SBD-ACCESSORIES' },
      { dayNumber: 6, label: 'Rest', isRestDay: true, workoutSlug: null },
      { dayNumber: 7, label: 'Rest', isRestDay: true, workoutSlug: null },
    ],
  },
];

export const NEW_MESOCYCLE_TEMPLATES: NewTemplateInput[] = [
  { slug: 'MC-033', name: 'Full Body - Beginner', level: 'Beginner', goal: 'Hypertrophy', splitStyle: 'FULL_BODY', durationWeeksMin: 6, durationWeeksMax: 6, daysPerWeek: 3, difficultyWarning: null, featured: false, primaryFocus: 'Full Body', split: { 'Day 1': 'Full Body', 'Day 2': 'Rest', 'Day 3': 'Full Body', 'Day 4': 'Rest', 'Day 5': 'Full Body', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-034', name: 'Full Body - Intermediate', level: 'Intermediate', goal: 'Hypertrophy', splitStyle: 'FULL_BODY', durationWeeksMin: 8, durationWeeksMax: 8, daysPerWeek: 4, difficultyWarning: null, featured: false, primaryFocus: 'Full Body', split: { 'Day 1': 'Full Body Heavy', 'Day 2': 'Rest', 'Day 3': 'Full Body Volume', 'Day 4': 'Rest', 'Day 5': 'Full Body', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-035', name: 'Full Body - Advanced', level: 'Advanced', goal: 'Hypertrophy', splitStyle: 'FULL_BODY', durationWeeksMin: 8, durationWeeksMax: 10, daysPerWeek: 5, difficultyWarning: 'High systemic fatigue', featured: false, primaryFocus: 'Full Body', split: { 'Day 1': 'Full Heavy', 'Day 2': 'Full Volume', 'Day 3': 'Rest', 'Day 4': 'Full Pump', 'Day 5': 'Weak Point', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-036', name: 'Chest Focus - Beginner', level: 'Beginner', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 6, durationWeeksMax: 6, daysPerWeek: 3, difficultyWarning: null, featured: false, primaryFocus: 'Chest', split: { 'Day 1': 'Upper (Chest Bias)', 'Day 2': 'Rest', 'Day 3': 'Lower', 'Day 4': 'Rest', 'Day 5': 'Upper (Chest Bias)', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-037', name: 'Chest Focus - Intermediate', level: 'Intermediate', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 8, durationWeeksMax: 8, daysPerWeek: 4, difficultyWarning: null, featured: false, primaryFocus: 'Chest', split: { 'Day 1': 'Chest Heavy', 'Day 2': 'Lower', 'Day 3': 'Rest', 'Day 4': 'Chest Volume', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-038', name: 'Chest Focus - Advanced', level: 'Advanced', goal: 'Hypertrophy', splitStyle: 'SPECIALIZATION', durationWeeksMin: 8, durationWeeksMax: 10, daysPerWeek: 5, difficultyWarning: 'Near MRV weekly', featured: false, primaryFocus: 'Chest', split: { 'Day 1': 'Chest Heavy', 'Day 2': 'Back', 'Day 3': 'Chest Volume', 'Day 4': 'Rest', 'Day 5': 'Chest Pump', 'Day 6': 'Lower', 'Day 7': 'Rest' } },
  { slug: 'MC-039', name: 'Quad Focus - Beginner', level: 'Beginner', goal: 'Hypertrophy', splitStyle: 'LOWER_BIAS', durationWeeksMin: 6, durationWeeksMax: 6, daysPerWeek: 3, difficultyWarning: null, featured: false, primaryFocus: 'Quads', split: { 'Day 1': 'Lower (Quad)', 'Day 2': 'Rest', 'Day 3': 'Upper', 'Day 4': 'Rest', 'Day 5': 'Lower (Quad)', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-040', name: 'Quad Focus - Intermediate', level: 'Intermediate', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 8, durationWeeksMax: 8, daysPerWeek: 4, difficultyWarning: null, featured: false, primaryFocus: 'Quads', split: { 'Day 1': 'Quad Heavy', 'Day 2': 'Upper', 'Day 3': 'Rest', 'Day 4': 'Quad Volume', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-041', name: 'Quad Focus - Advanced', level: 'Advanced', goal: 'Hypertrophy', splitStyle: 'SPECIALIZATION', durationWeeksMin: 8, durationWeeksMax: 10, daysPerWeek: 5, difficultyWarning: 'CNS + quad fatigue high', featured: false, primaryFocus: 'Quads', split: { 'Day 1': 'Quad Heavy', 'Day 2': 'Push', 'Day 3': 'Quad Volume', 'Day 4': 'Rest', 'Day 5': 'Quad Pump', 'Day 6': 'Upper', 'Day 7': 'Rest' } },
  { slug: 'MC-042', name: 'Glutes - Beginner', level: 'Beginner', goal: 'Hypertrophy', splitStyle: 'LOWER_BIAS', durationWeeksMin: 6, durationWeeksMax: 6, daysPerWeek: 3, difficultyWarning: null, featured: false, primaryFocus: 'Glutes', split: { 'Day 1': 'Glutes', 'Day 2': 'Rest', 'Day 3': 'Upper', 'Day 4': 'Rest', 'Day 5': 'Glutes', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-043', name: 'Glutes - Intermediate', level: 'Intermediate', goal: 'Hypertrophy', splitStyle: 'LOWER_BIAS', durationWeeksMin: 8, durationWeeksMax: 8, daysPerWeek: 4, difficultyWarning: null, featured: false, primaryFocus: 'Glutes', split: { 'Day 1': 'Glutes Heavy', 'Day 2': 'Upper', 'Day 3': 'Rest', 'Day 4': 'Glutes Volume', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-044', name: 'Glutes - Advanced', level: 'Advanced', goal: 'Hypertrophy', splitStyle: 'SPECIALIZATION', durationWeeksMin: 8, durationWeeksMax: 10, daysPerWeek: 5, difficultyWarning: null, featured: false, primaryFocus: 'Glutes', split: { 'Day 1': 'Glutes Heavy', 'Day 2': 'Upper', 'Day 3': 'Glutes Volume', 'Day 4': 'Rest', 'Day 5': 'Glutes Pump', 'Day 6': 'Upper', 'Day 7': 'Rest' } },
  { slug: 'MC-045', name: 'Arms - Beginner', level: 'Beginner', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 6, durationWeeksMax: 6, daysPerWeek: 3, difficultyWarning: null, featured: false, primaryFocus: 'Arms', split: { 'Day 1': 'Upper (Arms Bias)', 'Day 2': 'Rest', 'Day 3': 'Lower', 'Day 4': 'Rest', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-046', name: 'Arms - Intermediate', level: 'Intermediate', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 8, durationWeeksMax: 8, daysPerWeek: 4, difficultyWarning: null, featured: false, primaryFocus: 'Arms', split: { 'Day 1': 'Arms Heavy', 'Day 2': 'Lower', 'Day 3': 'Rest', 'Day 4': 'Arms Volume', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-047', name: 'Arms - Advanced', level: 'Advanced', goal: 'Hypertrophy', splitStyle: 'SPECIALIZATION', durationWeeksMin: 8, durationWeeksMax: 10, daysPerWeek: 5, difficultyWarning: null, featured: false, primaryFocus: 'Arms', split: { 'Day 1': 'Arms Heavy', 'Day 2': 'Push', 'Day 3': 'Arms Volume', 'Day 4': 'Rest', 'Day 5': 'Arms Pump', 'Day 6': 'Pull', 'Day 7': 'Rest' } },
  { slug: 'MC-048', name: 'Shoulders - Beginner', level: 'Beginner', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 6, durationWeeksMax: 6, daysPerWeek: 3, difficultyWarning: null, featured: false, primaryFocus: 'Shoulders', split: { 'Day 1': 'Upper (Shoulder Bias)', 'Day 2': 'Rest', 'Day 3': 'Lower', 'Day 4': 'Rest', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-049', name: 'Shoulders - Intermediate', level: 'Intermediate', goal: 'Hypertrophy', splitStyle: 'UPPER_LOWER', durationWeeksMin: 8, durationWeeksMax: 8, daysPerWeek: 4, difficultyWarning: null, featured: false, primaryFocus: 'Shoulders', split: { 'Day 1': 'Shoulders Heavy', 'Day 2': 'Lower', 'Day 3': 'Rest', 'Day 4': 'Shoulders Volume', 'Day 5': 'Upper', 'Day 6': 'Rest', 'Day 7': 'Rest' } },
  { slug: 'MC-050', name: 'Shoulders - Advanced', level: 'Advanced', goal: 'Hypertrophy', splitStyle: 'SPECIALIZATION', durationWeeksMin: 8, durationWeeksMax: 10, daysPerWeek: 5, difficultyWarning: null, featured: false, primaryFocus: 'Shoulders', split: { 'Day 1': 'Shoulders Heavy', 'Day 2': 'Pull', 'Day 3': 'Shoulders Volume', 'Day 4': 'Rest', 'Day 5': 'Shoulders Pump', 'Day 6': 'Legs', 'Day 7': 'Rest' } },
];

const ALL_MESOCYCLE_TEMPLATES: MesocycleTemplateSeed[] = [
  ...MESOCYCLE_TEMPLATES,
  ...NEW_MESOCYCLE_TEMPLATES.map((template) => {
    const level = mapLevel(template.level);
    const days = Object.entries(template.split).map(([dayKey, label]) => {
      const dayNumber = Number(dayKey.replace(/[^0-9]/g, ''));
      const isRestDay = label.toLowerCase() === 'rest';
      return {
        dayNumber,
        label,
        isRestDay,
        workoutSlug: isRestDay ? null : resolveWorkoutSlug(label, level),
      };
    });

    return {
      slug: template.slug,
      name: template.name,
      level,
      goal: mapGoal(template.goal),
      splitStyle: mapSplitStyle(template.splitStyle),
      primaryFocus: template.primaryFocus,
      durationWeeksMin: template.durationWeeksMin,
      durationWeeksMax: template.durationWeeksMax,
      daysPerWeek: template.daysPerWeek,
      progressionType: 'RPE-based',
      difficultyWarning: template.difficultyWarning ?? undefined,
      featured: template.featured,
      days,
    };
  }),
];

// ================================================================
// SEED FUNCTION
// ================================================================

export async function seedTemplates() {
  const wtSlugToId = new Map<string, string>();

  for (const wt of WORKOUT_TEMPLATES) {
    const record = await prisma.workoutTemplate.upsert({
      where:  { slug: wt.slug },
      update: {
        name:          wt.name,
        level:         wt.level,
        goal:          wt.goal,
        primaryMuscle: wt.primaryMuscle,
        splitType:     wt.splitType,
        daysPerWeek:   wt.daysPerWeek,
      },
      create: {
        slug:          wt.slug,
        name:          wt.name,
        level:         wt.level,
        goal:          wt.goal,
        primaryMuscle: wt.primaryMuscle,
        splitType:     wt.splitType,
        daysPerWeek:   wt.daysPerWeek,
      },
    });
    wtSlugToId.set(wt.slug, record.id);

    // Recreate slots cleanly (delete-all-then-create is safe in seed context)
    await prisma.templateSlot.deleteMany({ where: { workoutTemplateId: record.id } });
    await prisma.templateSlot.createMany({
      data: wt.slots.map(s => ({
        workoutTemplateId: record.id,
        order:      s.order,
        slotLabel:  s.slotLabel,
        setsMin:    s.setsMin,
        setsMax:    s.setsMax,
        repsMin:    s.repsMin,
        repsMax:    s.repsMax,
        rpeMin:     s.rpeMin,
        rpeMax:     s.rpeMax,
      })),
    });
  }

  console.log('✓ Seeded workout templates');

  for (const template of ALL_MESOCYCLE_TEMPLATES) {
    const record = await prisma.mesocycleTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        level: template.level,
        goal: template.goal,
        splitStyle: template.splitStyle,
        primaryFocus: template.primaryFocus,
        durationWeeksMin: template.durationWeeksMin,
        durationWeeksMax: template.durationWeeksMax,
        daysPerWeek: template.daysPerWeek,
        progressionType: template.progressionType,
        progressionNotes: template.progressionNotes ?? null,
        deloadWeek: template.deloadWeek ?? null,
        deloadNotes: template.deloadNotes ?? null,
        difficultyWarning: template.difficultyWarning ?? null,
        featured: template.featured,
      },
      create: {
        slug: template.slug,
        name: template.name,
        level: template.level,
        goal: template.goal,
        splitStyle: template.splitStyle,
        primaryFocus: template.primaryFocus,
        durationWeeksMin: template.durationWeeksMin,
        durationWeeksMax: template.durationWeeksMax,
        daysPerWeek: template.daysPerWeek,
        progressionType: template.progressionType,
        progressionNotes: template.progressionNotes ?? null,
        deloadWeek: template.deloadWeek ?? null,
        deloadNotes: template.deloadNotes ?? null,
        difficultyWarning: template.difficultyWarning ?? null,
        featured: template.featured,
      },
    });

    await prisma.workoutTemplateDay.deleteMany({ where: { mesocycleTemplateId: record.id } });
    await prisma.workoutTemplateDay.createMany({
      data: template.days.map((day) => ({
        mesocycleTemplateId: record.id,
        dayNumber: day.dayNumber,
        label: day.label,
        isRestDay: day.isRestDay,
        workoutTemplateId: day.workoutSlug ? (wtSlugToId.get(day.workoutSlug) ?? null) : null,
      })),
    });
  }

  console.log('✓ Seeded mesocycle templates');
  return wtSlugToId;
}

// Main execution: npx ts-node prisma/seeds/templates.seed.ts
if (require.main === module) {
  seedTemplates()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
