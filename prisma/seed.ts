import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { seedSplitCatalog } from './seed-split-catalog'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter } as any)

type TemplateExerciseSeed = {
  name: string
  setsTarget: number
  repRangeMin: number
  repRangeMax: number
}

type TemplateDaySeed = {
  dayNumber: number
  label: string
  exercises: TemplateExerciseSeed[]
}

type WorkoutTemplateSeed = {
  name: string
  splitType: string
  daysPerWeek: number
  splitLabel: string
  days: TemplateDaySeed[]
}

type ExerciseCategoryValue =
  | 'PRIMARY_COMPOUND'
  | 'COMPOUND_ACCESSORY'
  | 'ISOLATION_PRIMARY'
  | 'ISOLATION_AUXILIARY'

const exerciseCategoryByName: Record<string, ExerciseCategoryValue> = {
  // PRIMARY_COMPOUND
  'Barbell Back Squat': 'PRIMARY_COMPOUND',
  'Conventional Deadlift': 'PRIMARY_COMPOUND', // guide uses "Barbell Deadlift"
  'Barbell Bench Press': 'PRIMARY_COMPOUND',
  'Barbell Overhead Press': 'PRIMARY_COMPOUND',
  'Barbell Row': 'PRIMARY_COMPOUND',
  'Romanian Deadlift': 'PRIMARY_COMPOUND',
  'Barbell Front Squat': 'PRIMARY_COMPOUND', // guide uses "Front Squat"
  'Sumo Deadlift': 'PRIMARY_COMPOUND',
  'Close Grip Bench Press': 'PRIMARY_COMPOUND', // guide uses "Close-Grip Bench Press"
  'Barbell Incline Bench Press': 'PRIMARY_COMPOUND', // guide uses "Incline Barbell Bench Press"

  // COMPOUND_ACCESSORY
  'Leg Press': 'COMPOUND_ACCESSORY',
  'Dumbbell Flat Press': 'COMPOUND_ACCESSORY', // closest to "Dumbbell Bench Press"
  'Dumbbell Incline Press': 'COMPOUND_ACCESSORY',
  'Cable Row': 'COMPOUND_ACCESSORY', // guide allows "Cable Row / Seated Cable Row"
  'Bulgarian Split Squat': 'COMPOUND_ACCESSORY', // guide allows split squat variants
  'Dumbbell Shoulder Press': 'COMPOUND_ACCESSORY',
  'Pull-Up': 'COMPOUND_ACCESSORY', // guide allows weighted variant
  'Dip': 'COMPOUND_ACCESSORY', // guide allows weighted variant
  'Hack Squat': 'COMPOUND_ACCESSORY',
  'Chest-Supported Row': 'COMPOUND_ACCESSORY',
  'Barbell Decline Bench Press': 'COMPOUND_ACCESSORY', // closest compound pressing variant
  'Dumbbell Decline Press': 'COMPOUND_ACCESSORY', // closest compound pressing variant
  'Machine Chest Press': 'COMPOUND_ACCESSORY', // machine compound movement
  'Machine Incline Press': 'COMPOUND_ACCESSORY', // machine compound movement
  'Dumbbell Row': 'COMPOUND_ACCESSORY', // unilateral compound pull
  'Machine Row': 'COMPOUND_ACCESSORY', // machine compound movement
  'Wide Grip Lat Pulldown': 'COMPOUND_ACCESSORY', // pulldown variant
  'Machine Shoulder Press': 'COMPOUND_ACCESSORY', // machine compound movement
  'Arnold Press': 'COMPOUND_ACCESSORY', // dumbbell compound pressing variant
  'Walking Lunge': 'COMPOUND_ACCESSORY', // split squat/lunge pattern
  'Step-Up': 'COMPOUND_ACCESSORY', // unilateral compound lower-body movement
  'Goblet Squat': 'COMPOUND_ACCESSORY', // loaded squat pattern, non-primary compound
  'Dumbbell Romanian Deadlift': 'COMPOUND_ACCESSORY', // DB hinge variant
  'Good Morning': 'COMPOUND_ACCESSORY', // barbell hinge accessory
  'Dumbbell Hip Thrust': 'COMPOUND_ACCESSORY', // hip thrust variant
  'Smith Machine Hip Thrust': 'COMPOUND_ACCESSORY', // machine hip thrust variant
  'Diamond Push-Up': 'COMPOUND_ACCESSORY', // bodyweight compound pressing

  // ISOLATION_PRIMARY
  'Leg Curl': 'ISOLATION_PRIMARY',
  'Seated Leg Curl': 'ISOLATION_PRIMARY',
  'Leg Extension': 'ISOLATION_PRIMARY',
  'Cable Fly': 'ISOLATION_PRIMARY',
  'Cable Incline Fly': 'ISOLATION_PRIMARY',
  'Cable Decline Fly': 'ISOLATION_PRIMARY',
  'Pec Deck': 'ISOLATION_PRIMARY',
  'Lat Pulldown': 'ISOLATION_PRIMARY',
  'Barbell Curl': 'ISOLATION_PRIMARY',
  'Dumbbell Curl': 'ISOLATION_PRIMARY',
  'Cable Curl': 'ISOLATION_PRIMARY',
  'Tricep Pushdown': 'ISOLATION_PRIMARY',
  'Overhead Tricep Extension': 'ISOLATION_PRIMARY',
  'Hip Thrust': 'ISOLATION_PRIMARY',
  'Glute Bridge': 'ISOLATION_PRIMARY',
  'Seated Calf Raise': 'ISOLATION_PRIMARY',
  'Calf Raise': 'ISOLATION_PRIMARY', // closest to "Standing Calf Raise"
  'Incline Dumbbell Curl': 'ISOLATION_PRIMARY',
  'Hammer Curl': 'ISOLATION_PRIMARY',
  'Preacher Curl': 'ISOLATION_PRIMARY',
  'Machine Curl': 'ISOLATION_PRIMARY',
  'Cable Hammer Curl': 'ISOLATION_PRIMARY',
  'Concentration Curl': 'ISOLATION_PRIMARY',
  'Spider Curl': 'ISOLATION_PRIMARY',
  'Cable Rope Curl': 'ISOLATION_PRIMARY',
  'Skull Crusher': 'ISOLATION_PRIMARY',
  'Tricep Kickback': 'ISOLATION_PRIMARY',
  'Dumbbell Overhead Tricep Extension': 'ISOLATION_PRIMARY',
  'Cable Rope Pushdown': 'ISOLATION_PRIMARY',
  'Machine Tricep Press': 'ISOLATION_PRIMARY',
  'Straight Arm Pulldown': 'ISOLATION_PRIMARY', // lats-focused single-joint pattern
  'Cable Kickback': 'ISOLATION_PRIMARY',
  'Hip Abduction Machine': 'ISOLATION_PRIMARY',
  'Cable Hip Abduction': 'ISOLATION_PRIMARY',
  'Donkey Calf Raise': 'ISOLATION_PRIMARY',
  'Single Leg Calf Raise': 'ISOLATION_PRIMARY',

  // ISOLATION_AUXILIARY
  'Dumbbell Lateral Raise': 'ISOLATION_AUXILIARY',
  'Cable Lateral Raise': 'ISOLATION_AUXILIARY',
  'Machine Lateral Raise': 'ISOLATION_AUXILIARY',
  'Rear Delt Machine Fly': 'ISOLATION_AUXILIARY', // guide allows rear delt / reverse pec deck
  'Reverse Fly': 'ISOLATION_AUXILIARY', // guide allows rear delt fly variants
  'Face Pull': 'ISOLATION_AUXILIARY',
  'Reverse Curl': 'ISOLATION_AUXILIARY', // forearm-dominant curl variant
  'Nordic Hamstring Curl': 'ISOLATION_AUXILIARY', // guide mismatch: not listed; treated as high-leverage-demand isolation
}

const movementClassByName: Record<string, string | null> = {
  'Barbell Bench Press': 'CHEST_HORIZONTAL_PRESS',
  'Barbell Incline Bench Press': 'CHEST_INCLINE_PRESS',
  'Barbell Decline Bench Press': 'CHEST_HORIZONTAL_PRESS',
  'Dumbbell Flat Press': 'CHEST_HORIZONTAL_PRESS',
  'Dumbbell Incline Press': 'CHEST_INCLINE_PRESS',
  'Dumbbell Decline Press': 'CHEST_HORIZONTAL_PRESS',
  'Machine Chest Press': 'CHEST_HORIZONTAL_PRESS',
  'Machine Incline Press': 'CHEST_INCLINE_PRESS',
  'Cable Fly': 'CHEST_ADDUCTION_FLY',
  'Cable Incline Fly': 'CHEST_ADDUCTION_FLY',
  'Cable Decline Fly': 'CHEST_ADDUCTION_FLY',
  'Dip': 'CHEST_HORIZONTAL_PRESS',
  'Pec Deck': 'CHEST_ADDUCTION_FLY',
  'Dumbbell Fly': 'CHEST_ADDUCTION_FLY',
  'Dumbbell Incline Fly': 'CHEST_ADDUCTION_FLY',
  'Dumbbell Decline Fly': 'CHEST_ADDUCTION_FLY',

  'Conventional Deadlift': 'BACK_AXIAL_HINGE',
  'Sumo Deadlift': 'BACK_AXIAL_HINGE',
  'Barbell Row': 'BACK_HORIZONTAL_PULL',
  'Cable Row': 'BACK_HORIZONTAL_PULL',
  'Dumbbell Row': 'BACK_HORIZONTAL_PULL',
  'Chest-Supported Row': 'BACK_HORIZONTAL_PULL',
  'Machine Row': 'BACK_HORIZONTAL_PULL',
  'Pull-Up': 'BACK_VERTICAL_PULL',
  'Lat Pulldown': 'BACK_VERTICAL_PULL',
  'Wide Grip Lat Pulldown': 'BACK_VERTICAL_PULL',
  'Straight Arm Pulldown': 'BACK_STRAIGHT_ARM_PULL',

  'Barbell Overhead Press': 'SHOULDER_VERTICAL_PRESS',
  'Dumbbell Shoulder Press': 'SHOULDER_VERTICAL_PRESS',
  'Machine Shoulder Press': 'SHOULDER_VERTICAL_PRESS',
  'Arnold Press': 'SHOULDER_VERTICAL_PRESS',
  'Dumbbell Lateral Raise': 'SHOULDER_LATERAL_ABDUCTION',
  'Cable Lateral Raise': 'SHOULDER_LATERAL_ABDUCTION',
  'Machine Lateral Raise': 'SHOULDER_LATERAL_ABDUCTION',
  'Face Pull': 'SHOULDER_REAR_DELT',
  'Reverse Fly': 'SHOULDER_REAR_DELT',
  'Rear Delt Machine Fly': 'SHOULDER_REAR_DELT',

  'Barbell Back Squat': 'QUAD_BILATERAL_SQUAT',
  'Barbell Front Squat': 'QUAD_BILATERAL_SQUAT',
  'Leg Press': 'QUAD_MACHINE_PRESS',
  'Leg Extension': 'QUAD_KNEE_EXTENSION',
  'Bulgarian Split Squat': 'QUAD_UNILATERAL',
  'Walking Lunge': 'QUAD_UNILATERAL',
  'Step-Up': 'QUAD_UNILATERAL',
  'Hack Squat': 'QUAD_BILATERAL_SQUAT',
  'Goblet Squat': 'QUAD_BILATERAL_SQUAT',

  'Romanian Deadlift': 'HAMSTRING_HIP_HINGE',
  'Dumbbell Romanian Deadlift': 'HAMSTRING_HIP_HINGE',
  'Leg Curl': 'HAMSTRING_KNEE_FLEXION',
  'Seated Leg Curl': 'HAMSTRING_KNEE_FLEXION',
  'Nordic Hamstring Curl': 'HAMSTRING_KNEE_FLEXION',
  'Good Morning': 'HAMSTRING_HIP_HINGE',

  'Barbell Curl': 'BICEP_SUPINATED_CURL',
  'Dumbbell Curl': 'BICEP_SUPINATED_CURL',
  'Cable Curl': 'BICEP_SUPINATED_CURL',
  'Incline Dumbbell Curl': 'BICEP_LENGTHENED',
  'Hammer Curl': 'BICEP_NEUTRAL_BRACHIALIS',
  'Preacher Curl': 'BICEP_SHORTENED',
  'Machine Curl': 'BICEP_SHORTENED',
  'Cable Hammer Curl': 'BICEP_NEUTRAL_BRACHIALIS',
  'Concentration Curl': 'BICEP_SHORTENED',
  'Spider Curl': 'BICEP_SHORTENED',
  'Reverse Curl': 'BICEP_NEUTRAL_BRACHIALIS',
  'Cable Rope Curl': 'BICEP_SUPINATED_CURL',

  'Tricep Pushdown': 'TRICEP_PUSHDOWN',
  'Overhead Tricep Extension': 'TRICEP_OVERHEAD_EXTENSION',
  'Skull Crusher': 'TRICEP_OVERHEAD_EXTENSION',
  'Tricep Kickback': 'TRICEP_PUSHDOWN',
  'Close Grip Bench Press': 'TRICEP_PRESS_COMPOUND',
  'Dumbbell Overhead Tricep Extension': 'TRICEP_OVERHEAD_EXTENSION',
  'Cable Rope Pushdown': 'TRICEP_PUSHDOWN',
  'Machine Tricep Press': 'TRICEP_PUSHDOWN',
  'Diamond Push-Up': 'TRICEP_PRESS_COMPOUND',

  'Hip Thrust': 'GLUTE_HIP_THRUST',
  'Dumbbell Hip Thrust': 'GLUTE_HIP_THRUST',
  'Glute Bridge': 'GLUTE_HIP_THRUST',
  'Cable Kickback': 'GLUTE_KICKBACK',
  'Hip Abduction Machine': 'GLUTE_HIP_ABDUCTION',
  'Cable Hip Abduction': 'GLUTE_HIP_ABDUCTION',
  'Smith Machine Hip Thrust': 'GLUTE_HIP_THRUST',
  'Calf Raise': 'CALF_STANDING',
  'Seated Calf Raise': 'CALF_SEATED',
  'Donkey Calf Raise': 'CALF_STANDING',
  'Single Leg Calf Raise': 'CALF_UNILATERAL',
}

async function main() {
  const barbell = await prisma.equipmentProfile.upsert({
    where: { name: 'BARBELL' },
    update: {},
    create: { name: 'BARBELL', requiredEquipment: ['barbell', 'rack'] },
  })
  const dumbbell = await prisma.equipmentProfile.upsert({
    where: { name: 'DUMBBELL' },
    update: {},
    create: { name: 'DUMBBELL', requiredEquipment: ['dumbbells'] },
  })
  const cable = await prisma.equipmentProfile.upsert({
    where: { name: 'CABLE' },
    update: {},
    create: { name: 'CABLE', requiredEquipment: ['cable_machine'] },
  })
  const bodyweight = await prisma.equipmentProfile.upsert({
    where: { name: 'BODYWEIGHT' },
    update: {},
    create: { name: 'BODYWEIGHT', requiredEquipment: [] },
  })
  const machine = await prisma.equipmentProfile.upsert({
    where: { name: 'MACHINE' },
    update: {},
    create: { name: 'MACHINE', requiredEquipment: ['machine'] },
  })

  const controlled = await prisma.executionProfile.upsert({
    where: { zone: 'CONTROLLED' },
    update: {},
    create: { zone: 'CONTROLLED', description: 'Slow controlled tempo', rpeRange: '6-8', multiplier: 1.0 },
  })
  const hypertrophy = await prisma.executionProfile.upsert({
    where: { zone: 'HYPERTROPHY' },
    update: {},
    create: { zone: 'HYPERTROPHY', description: 'Moderate tempo with full stretch', rpeRange: '7-9', multiplier: 1.1 },
  })
  const performance = await prisma.executionProfile.upsert({
    where: { zone: 'PERFORMANCE' },
    update: {},
    create: { zone: 'PERFORMANCE', description: 'Explosive intent-driven', rpeRange: '8-10', multiplier: 1.2 },
  })

  const exercises = [
    // ── CHEST ──────────────────────────────────────────────────
    { name: 'Barbell Bench Press', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Barbell Incline Bench Press', primaryMuscle: 'CHEST', secondaryMuscles: ['FRONT_DELT', 'TRICEPS'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Barbell Decline Bench Press', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Dumbbell Flat Press', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Dumbbell Incline Press', primaryMuscle: 'CHEST', secondaryMuscles: ['FRONT_DELT', 'TRICEPS'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Dumbbell Decline Press', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Machine Chest Press', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.7, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },
    { name: 'Machine Incline Press', primaryMuscle: 'CHEST', secondaryMuscles: ['FRONT_DELT', 'TRICEPS'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.7, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },
    { name: 'Cable Fly', primaryMuscle: 'CHEST', secondaryMuscles: ['FRONT_DELT'], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: cable, execution: controlled },
    { name: 'Cable Incline Fly', primaryMuscle: 'CHEST', secondaryMuscles: ['FRONT_DELT'], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: cable, execution: controlled },
    { name: 'Cable Decline Fly', primaryMuscle: 'CHEST', secondaryMuscles: ['FRONT_DELT'], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: cable, execution: controlled },
    { name: 'Dip', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: bodyweight, execution: hypertrophy },
    { name: 'Pec Deck', primaryMuscle: 'CHEST', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },

    // ── BACK / LATS ────────────────────────────────────────────
    { name: 'Conventional Deadlift', primaryMuscle: 'BACK', secondaryMuscles: ['GLUTES', 'HAMSTRINGS', 'QUADS'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 10, stabilityDemand: 1.4, methodFatigueMultiplier: 1.0, equipment: barbell, execution: performance },
    { name: 'Sumo Deadlift', primaryMuscle: 'BACK', secondaryMuscles: ['GLUTES', 'HAMSTRINGS', 'QUADS'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 9, stabilityDemand: 1.3, methodFatigueMultiplier: 1.0, equipment: barbell, execution: performance },
    { name: 'Barbell Row', primaryMuscle: 'BACK', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'HORIZONTAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 8, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Cable Row', primaryMuscle: 'BACK', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'HORIZONTAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: cable, execution: hypertrophy },
    { name: 'Dumbbell Row', primaryMuscle: 'BACK', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'HORIZONTAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.0, methodFatigueMultiplier: 0.9, equipment: dumbbell, execution: hypertrophy },
    { name: 'Chest-Supported Row', primaryMuscle: 'BACK', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'HORIZONTAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.8, methodFatigueMultiplier: 0.9, equipment: dumbbell, execution: hypertrophy },
    { name: 'Machine Row', primaryMuscle: 'BACK', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'HORIZONTAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.7, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },
    { name: 'Pull-Up', primaryMuscle: 'LATS', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'VERTICAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.0, methodFatigueMultiplier: 1.0, equipment: bodyweight, execution: hypertrophy },
    { name: 'Lat Pulldown', primaryMuscle: 'LATS', secondaryMuscles: ['BICEPS'], movementPattern: 'VERTICAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.8, methodFatigueMultiplier: 0.9, equipment: cable, execution: hypertrophy },
    { name: 'Wide Grip Lat Pulldown', primaryMuscle: 'LATS', secondaryMuscles: ['BICEPS', 'REAR_DELT'], movementPattern: 'VERTICAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.8, methodFatigueMultiplier: 0.9, equipment: cable, execution: hypertrophy },
    { name: 'Straight Arm Pulldown', primaryMuscle: 'LATS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },

    // ── SHOULDERS ──────────────────────────────────────────────
    { name: 'Barbell Overhead Press', primaryMuscle: 'FRONT_DELT', secondaryMuscles: ['SIDE_DELT', 'TRICEPS'], movementPattern: 'VERTICAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Dumbbell Shoulder Press', primaryMuscle: 'FRONT_DELT', secondaryMuscles: ['SIDE_DELT', 'TRICEPS'], movementPattern: 'VERTICAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Machine Shoulder Press', primaryMuscle: 'FRONT_DELT', secondaryMuscles: ['SIDE_DELT', 'TRICEPS'], movementPattern: 'VERTICAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.7, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },
    { name: 'Dumbbell Lateral Raise', primaryMuscle: 'SIDE_DELT', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.8, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Cable Lateral Raise', primaryMuscle: 'SIDE_DELT', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.8, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Machine Lateral Raise', primaryMuscle: 'SIDE_DELT', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Face Pull', primaryMuscle: 'REAR_DELT', secondaryMuscles: ['SIDE_DELT'], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Reverse Fly', primaryMuscle: 'REAR_DELT', secondaryMuscles: ['SIDE_DELT'], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Rear Delt Machine Fly', primaryMuscle: 'REAR_DELT', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Arnold Press', primaryMuscle: 'FRONT_DELT', secondaryMuscles: ['SIDE_DELT', 'TRICEPS'], movementPattern: 'VERTICAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },

    // ── QUADS ──────────────────────────────────────────────────
    { name: 'Barbell Back Squat', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 9, stabilityDemand: 1.3, methodFatigueMultiplier: 1.0, equipment: barbell, execution: performance },
    { name: 'Barbell Front Squat', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 8, stabilityDemand: 1.3, methodFatigueMultiplier: 1.0, equipment: barbell, execution: performance },
    { name: 'Leg Press', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 0.8, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },
    { name: 'Leg Extension', primaryMuscle: 'QUADS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Bulgarian Split Squat', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 8, stabilityDemand: 1.3, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Walking Lunge', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Step-Up', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 0.9, equipment: dumbbell, execution: hypertrophy },
    { name: 'Hack Squat', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },
    { name: 'Goblet Squat', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.1, methodFatigueMultiplier: 0.9, equipment: dumbbell, execution: hypertrophy },

    // ── HAMSTRINGS ─────────────────────────────────────────────
    { name: 'Romanian Deadlift', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: ['GLUTES', 'LOWER_BACK'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 8, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Dumbbell Romanian Deadlift', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: ['GLUTES', 'LOWER_BACK'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: dumbbell, execution: hypertrophy },
    { name: 'Leg Curl', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Seated Leg Curl', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Nordic Hamstring Curl', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 7, stabilityDemand: 1.0, methodFatigueMultiplier: 1.0, equipment: bodyweight, execution: controlled },
    { name: 'Good Morning', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: ['GLUTES', 'LOWER_BACK'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: barbell, execution: controlled },

    // ── GLUTES ─────────────────────────────────────────────────
    { name: 'Hip Thrust', primaryMuscle: 'GLUTES', secondaryMuscles: ['HAMSTRINGS'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: barbell, execution: hypertrophy },
    { name: 'Dumbbell Hip Thrust', primaryMuscle: 'GLUTES', secondaryMuscles: ['HAMSTRINGS'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 5, stabilityDemand: 0.8, methodFatigueMultiplier: 0.9, equipment: dumbbell, execution: hypertrophy },
    { name: 'Glute Bridge', primaryMuscle: 'GLUTES', secondaryMuscles: ['HAMSTRINGS'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 4, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: bodyweight, execution: controlled },
    { name: 'Cable Kickback', primaryMuscle: 'GLUTES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Hip Abduction Machine', primaryMuscle: 'GLUTES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.7, equipment: machine, execution: controlled },
    { name: 'Cable Hip Abduction', primaryMuscle: 'GLUTES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Smith Machine Hip Thrust', primaryMuscle: 'GLUTES', secondaryMuscles: ['HAMSTRINGS'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 0.8, methodFatigueMultiplier: 0.9, equipment: machine, execution: hypertrophy },

    // ── BICEPS ─────────────────────────────────────────────────
    { name: 'Barbell Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: barbell, execution: controlled },
    { name: 'Dumbbell Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Cable Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Incline Dumbbell Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Hammer Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Preacher Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: barbell, execution: controlled },
    { name: 'Machine Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Cable Hammer Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Concentration Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 2, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Spider Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: barbell, execution: controlled },
    { name: 'Reverse Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: barbell, execution: controlled },
    { name: 'Cable Rope Curl', primaryMuscle: 'BICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },

    // ── TRICEPS ────────────────────────────────────────────────
    { name: 'Tricep Pushdown', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Overhead Tricep Extension', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.8, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Skull Crusher', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 4, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: barbell, execution: controlled },
    { name: 'Tricep Kickback', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 2, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Close Grip Bench Press', primaryMuscle: 'TRICEPS', secondaryMuscles: ['CHEST', 'FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.0, methodFatigueMultiplier: 0.9, equipment: barbell, execution: hypertrophy },
    { name: 'Dumbbell Overhead Tricep Extension', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.8, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
    { name: 'Cable Rope Pushdown', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: cable, execution: controlled },
    { name: 'Machine Tricep Press', primaryMuscle: 'TRICEPS', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.8, equipment: machine, execution: controlled },
    { name: 'Diamond Push-Up', primaryMuscle: 'TRICEPS', secondaryMuscles: ['CHEST'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 4, stabilityDemand: 0.9, methodFatigueMultiplier: 0.9, equipment: bodyweight, execution: controlled },

    // ── CALVES ─────────────────────────────────────────────────
    { name: 'Calf Raise', primaryMuscle: 'CALVES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.7, equipment: machine, execution: controlled },
    { name: 'Seated Calf Raise', primaryMuscle: 'CALVES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 2, stabilityDemand: 0.5, methodFatigueMultiplier: 0.7, equipment: machine, execution: controlled },
    { name: 'Donkey Calf Raise', primaryMuscle: 'CALVES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.6, methodFatigueMultiplier: 0.7, equipment: machine, execution: controlled },
    { name: 'Single Leg Calf Raise', primaryMuscle: 'CALVES', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.7, methodFatigueMultiplier: 0.8, equipment: bodyweight, execution: controlled },
  ]

  for (const ex of exercises) {
    const category = exerciseCategoryByName[ex.name]
    if (!category) {
      throw new Error(`Exercise category missing for seed exercise: ${ex.name}`)
    }

    const created = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        name: ex.name,
        category,
        primaryMuscle: ex.primaryMuscle as any,
        secondaryMuscles: ex.secondaryMuscles as any,
        movementPattern: ex.movementPattern as any,
        exerciseType: ex.exerciseType as any,
        movementClass: (movementClassByName[ex.name] ?? null) as any,
        isCompound: ex.isCompound,
      },
    })
    await prisma.exerciseMetadata.upsert({
      where: { exerciseId: created.id },
      update: {},
      create: {
        exerciseId: created.id,
        fatigueScore: ex.fatigueScore,
        stabilityDemand: ex.stabilityDemand,
        methodFatigueMultiplier: ex.methodFatigueMultiplier,
        equipmentProfileId: ex.equipment.id,
        executionProfileId: ex.execution.id,
      },
    })
  }

  // ─── Substitution Pools ──────────────────────────────────────────────────
  console.log('Seeding substitution pools...')

  const poolDefinitions = [
    // BACK
    {
      name: 'Back — Horizontal Pull',
      primaryMuscle: 'BACK',
      movementPattern: 'HORIZONTAL_PULL',
      exercises: [
        { name: 'Barbell Row',          priority: 1, suitableWhenPain: [] },
        { name: 'Cable Row',            priority: 2, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Dumbbell Row',         priority: 3, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Chest-Supported Row',  priority: 4, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Machine Row',          priority: 5, suitableWhenPain: ['LOWER_BACK', 'WRIST'] },
      ],
    },
    {
      name: 'Back — Vertical Pull',
      primaryMuscle: 'BACK',
      movementPattern: 'VERTICAL_PULL',
      exercises: [
        { name: 'Pull-Up',                priority: 1, suitableWhenPain: [] },
        { name: 'Lat Pulldown',           priority: 2, suitableWhenPain: ['SHOULDER'] },
        { name: 'Wide Grip Lat Pulldown', priority: 3, suitableWhenPain: [] },
      ],
    },
    {
      name: 'Back — Straight Arm Pull',
      primaryMuscle: 'BACK',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Straight Arm Pulldown', priority: 1, suitableWhenPain: ['ELBOW', 'WRIST'] },
      ],
    },
    {
      name: 'Back — Axial Hinge',
      primaryMuscle: 'BACK',
      movementPattern: 'HINGE',
      exercises: [
        { name: 'Conventional Deadlift', priority: 1, suitableWhenPain: [] },
        { name: 'Sumo Deadlift',         priority: 2, suitableWhenPain: ['LOWER_BACK'] },
      ],
    },
    // CHEST
    {
      name: 'Chest — Horizontal Press',
      primaryMuscle: 'CHEST',
      movementPattern: 'HORIZONTAL_PUSH',
      exercises: [
        { name: 'Barbell Bench Press',    priority: 1, suitableWhenPain: [] },
        { name: 'Dumbbell Flat Press',    priority: 2, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Barbell Decline Bench Press', priority: 3, suitableWhenPain: ['SHOULDER'] },
        { name: 'Dumbbell Decline Press', priority: 4, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Machine Chest Press',    priority: 5, suitableWhenPain: ['SHOULDER', 'WRIST', 'ELBOW'] },
        { name: 'Dip',                    priority: 6, suitableWhenPain: [] },
      ],
    },
    {
      name: 'Chest — Incline Press',
      primaryMuscle: 'CHEST',
      movementPattern: 'HORIZONTAL_PUSH',
      exercises: [
        { name: 'Barbell Incline Bench Press', priority: 1, suitableWhenPain: [] },
        { name: 'Dumbbell Incline Press',      priority: 2, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Machine Incline Press',       priority: 3, suitableWhenPain: ['SHOULDER', 'WRIST', 'ELBOW'] },
      ],
    },
    {
      name: 'Chest — Adduction Fly',
      primaryMuscle: 'CHEST',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Cable Fly',         priority: 1, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Cable Incline Fly', priority: 2, suitableWhenPain: ['SHOULDER'] },
        { name: 'Cable Decline Fly', priority: 3, suitableWhenPain: ['SHOULDER'] },
        { name: 'Pec Deck',          priority: 4, suitableWhenPain: ['SHOULDER', 'WRIST', 'ELBOW'] },
      ],
    },
    // SHOULDERS
    {
      name: 'Shoulder — Vertical Press',
      primaryMuscle: 'FRONT_DELT',
      movementPattern: 'VERTICAL_PUSH',
      exercises: [
        { name: 'Barbell Overhead Press',  priority: 1, suitableWhenPain: [] },
        { name: 'Dumbbell Shoulder Press', priority: 2, suitableWhenPain: ['SHOULDER'] },
        { name: 'Arnold Press',            priority: 3, suitableWhenPain: [] },
        { name: 'Machine Shoulder Press',  priority: 4, suitableWhenPain: ['SHOULDER', 'WRIST', 'ELBOW'] },
      ],
    },
    {
      name: 'Shoulder — Lateral Abduction',
      primaryMuscle: 'SIDE_DELT',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Dumbbell Lateral Raise', priority: 1, suitableWhenPain: [] },
        { name: 'Cable Lateral Raise',    priority: 2, suitableWhenPain: ['ELBOW', 'WRIST'] },
        { name: 'Machine Lateral Raise',  priority: 3, suitableWhenPain: ['ELBOW', 'WRIST', 'SHOULDER'] },
      ],
    },
    {
      name: 'Shoulder — Rear Delt',
      primaryMuscle: 'REAR_DELT',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Face Pull',            priority: 1, suitableWhenPain: ['SHOULDER', 'ELBOW'] },
        { name: 'Reverse Fly',          priority: 2, suitableWhenPain: ['SHOULDER'] },
        { name: 'Rear Delt Machine Fly',priority: 3, suitableWhenPain: ['SHOULDER', 'ELBOW', 'WRIST'] },
      ],
    },
    // QUADS
    {
      name: 'Quad — Bilateral Squat',
      primaryMuscle: 'QUADS',
      movementPattern: 'SQUAT',
      exercises: [
        { name: 'Barbell Back Squat',  priority: 1, suitableWhenPain: [] },
        { name: 'Barbell Front Squat', priority: 2, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Hack Squat',          priority: 3, suitableWhenPain: ['LOWER_BACK', 'HIP'] },
        { name: 'Goblet Squat',        priority: 4, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Leg Press',           priority: 5, suitableWhenPain: ['LOWER_BACK', 'HIP', 'KNEE'] },
      ],
    },
    {
      name: 'Quad — Machine Press',
      primaryMuscle: 'QUADS',
      movementPattern: 'SQUAT',
      exercises: [
        { name: 'Leg Press', priority: 1, suitableWhenPain: ['LOWER_BACK', 'HIP'] },
      ],
    },
    {
      name: 'Quad — Unilateral',
      primaryMuscle: 'QUADS',
      movementPattern: 'SQUAT',
      exercises: [
        { name: 'Bulgarian Split Squat', priority: 1, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Walking Lunge',         priority: 2, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Step-Up',               priority: 3, suitableWhenPain: ['LOWER_BACK', 'HIP', 'KNEE'] },
      ],
    },
    {
      name: 'Quad — Knee Extension',
      primaryMuscle: 'QUADS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Leg Extension', priority: 1, suitableWhenPain: ['LOWER_BACK', 'HIP'] },
      ],
    },
    // HAMSTRINGS
    {
      name: 'Hamstring — Hip Hinge',
      primaryMuscle: 'HAMSTRINGS',
      movementPattern: 'HINGE',
      exercises: [
        { name: 'Romanian Deadlift',         priority: 1, suitableWhenPain: [] },
        { name: 'Dumbbell Romanian Deadlift',priority: 2, suitableWhenPain: ['LOWER_BACK'] },
        { name: 'Good Morning',              priority: 3, suitableWhenPain: [] },
      ],
    },
    {
      name: 'Hamstring — Knee Flexion',
      primaryMuscle: 'HAMSTRINGS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Leg Curl',           priority: 1, suitableWhenPain: ['LOWER_BACK', 'HIP'] },
        { name: 'Seated Leg Curl',    priority: 2, suitableWhenPain: ['LOWER_BACK', 'HIP'] },
        { name: 'Nordic Hamstring Curl', priority: 3, suitableWhenPain: ['LOWER_BACK', 'HIP'] },
      ],
    },
    // GLUTES
    {
      name: 'Glute — Hip Thrust',
      primaryMuscle: 'GLUTES',
      movementPattern: 'HINGE',
      exercises: [
        { name: 'Hip Thrust',             priority: 1, suitableWhenPain: ['LOWER_BACK', 'KNEE'] },
        { name: 'Smith Machine Hip Thrust',priority: 2, suitableWhenPain: ['LOWER_BACK', 'KNEE'] },
        { name: 'Dumbbell Hip Thrust',    priority: 3, suitableWhenPain: ['LOWER_BACK', 'KNEE'] },
        { name: 'Glute Bridge',           priority: 4, suitableWhenPain: ['LOWER_BACK', 'KNEE', 'HIP'] },
      ],
    },
    {
      name: 'Glute — Hip Abduction',
      primaryMuscle: 'GLUTES',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Hip Abduction Machine', priority: 1, suitableWhenPain: ['LOWER_BACK', 'KNEE', 'ANKLE'] },
        { name: 'Cable Hip Abduction',   priority: 2, suitableWhenPain: ['LOWER_BACK', 'KNEE'] },
      ],
    },
    {
      name: 'Glute — Kickback',
      primaryMuscle: 'GLUTES',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Cable Kickback', priority: 1, suitableWhenPain: ['LOWER_BACK', 'KNEE', 'HIP'] },
      ],
    },
    // BICEPS
    {
      name: 'Bicep — Supinated Curl',
      primaryMuscle: 'BICEPS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Barbell Curl',    priority: 1, suitableWhenPain: [] },
        { name: 'Dumbbell Curl',   priority: 2, suitableWhenPain: ['WRIST', 'ELBOW'] },
        { name: 'Cable Curl',      priority: 3, suitableWhenPain: ['WRIST', 'ELBOW'] },
        { name: 'Cable Rope Curl', priority: 4, suitableWhenPain: ['WRIST', 'ELBOW', 'SHOULDER'] },
      ],
    },
    {
      name: 'Bicep — Lengthened',
      primaryMuscle: 'BICEPS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Incline Dumbbell Curl', priority: 1, suitableWhenPain: ['WRIST'] },
      ],
    },
    {
      name: 'Bicep — Shortened',
      primaryMuscle: 'BICEPS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Preacher Curl',      priority: 1, suitableWhenPain: ['SHOULDER'] },
        { name: 'Machine Curl',       priority: 2, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Concentration Curl', priority: 3, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Spider Curl',        priority: 4, suitableWhenPain: ['SHOULDER'] },
      ],
    },
    {
      name: 'Bicep — Neutral Brachialis',
      primaryMuscle: 'BICEPS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Hammer Curl',       priority: 1, suitableWhenPain: [] },
        { name: 'Cable Hammer Curl', priority: 2, suitableWhenPain: ['ELBOW', 'WRIST'] },
        { name: 'Reverse Curl',      priority: 3, suitableWhenPain: ['SHOULDER'] },
      ],
    },
    // TRICEPS
    {
      name: 'Tricep — Pushdown',
      primaryMuscle: 'TRICEPS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Tricep Pushdown',     priority: 1, suitableWhenPain: ['SHOULDER'] },
        { name: 'Cable Rope Pushdown', priority: 2, suitableWhenPain: ['SHOULDER', 'WRIST', 'ELBOW'] },
        { name: 'Machine Tricep Press',priority: 3, suitableWhenPain: ['SHOULDER', 'WRIST'] },
        { name: 'Tricep Kickback',     priority: 4, suitableWhenPain: ['SHOULDER', 'WRIST'] },
      ],
    },
    {
      name: 'Tricep — Overhead Extension',
      primaryMuscle: 'TRICEPS',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Overhead Tricep Extension',         priority: 1, suitableWhenPain: [] },
        { name: 'Skull Crusher',                     priority: 2, suitableWhenPain: [] },
        { name: 'Dumbbell Overhead Tricep Extension',priority: 3, suitableWhenPain: ['SHOULDER'] },
      ],
    },
    {
      name: 'Tricep — Press Compound',
      primaryMuscle: 'TRICEPS',
      movementPattern: 'HORIZONTAL_PUSH',
      exercises: [
        { name: 'Close Grip Bench Press', priority: 1, suitableWhenPain: [] },
        { name: 'Diamond Push-Up',        priority: 2, suitableWhenPain: ['WRIST', 'SHOULDER'] },
      ],
    },
    // CALVES
    {
      name: 'Calf — Standing',
      primaryMuscle: 'CALVES',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Calf Raise',       priority: 1, suitableWhenPain: ['KNEE', 'HIP'] },
        { name: 'Donkey Calf Raise',priority: 2, suitableWhenPain: ['KNEE', 'HIP'] },
      ],
    },
    {
      name: 'Calf — Seated',
      primaryMuscle: 'CALVES',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Seated Calf Raise', priority: 1, suitableWhenPain: ['KNEE', 'HIP', 'ANKLE', 'LOWER_BACK'] },
      ],
    },
    {
      name: 'Calf — Unilateral',
      primaryMuscle: 'CALVES',
      movementPattern: 'ISOLATION',
      exercises: [
        { name: 'Single Leg Calf Raise', priority: 1, suitableWhenPain: ['HIP', 'LOWER_BACK'] },
      ],
    },
  ]

  for (const poolDef of poolDefinitions) {
    const pool = await prisma.substitutionPool.upsert({
      where: { name: poolDef.name },
      update: {},
      create: {
        name: poolDef.name,
        primaryMuscle: poolDef.primaryMuscle,
        movementPattern: poolDef.movementPattern,
      },
    })

    for (const exDef of poolDef.exercises) {
      const exercise = await prisma.exercise.findUnique({
        where: { name: exDef.name },
      })
      if (!exercise) {
        console.warn(`  ⚠ Pool seed: exercise not found — "${exDef.name}"`)
        continue
      }
      await prisma.substitutionPoolExercise.upsert({
        where: {
          poolId_exerciseId: { poolId: pool.id, exerciseId: exercise.id },
        },
        update: {
          priority: exDef.priority,
          suitableWhenPain: exDef.suitableWhenPain,
        },
        create: {
          poolId: pool.id,
          exerciseId: exercise.id,
          priority: exDef.priority,
          suitableWhenPain: exDef.suitableWhenPain,
        },
      })
    }

    console.log(`  ✓ ${pool.name} (${poolDef.exercises.length} exercises)`)
  }

  console.log('Substitution pools seeded.')
  // ─── End Substitution Pools ───────────────────────────────────────────────

  const seedSplitCatalogFlag =
    process.env.SEED_SPLIT_CATALOG === 'true' ||
    process.env.SEED_SPLIT_CATALOG === '1'

  if (seedSplitCatalogFlag) {
    await seedSplitCatalog(prisma)
    console.log('Split template catalog seeded (10 templates).')
  } else {
  // ── LEGACY WORKOUT TEMPLATES (use SEED_SPLIT_CATALOG=true for catalog) ──
const templateDefs = [
  {
    name: 'Push Pull Legs',
    splitType: 'PPL',
    daysPerWeek: 3,
    description: 'Classic hypertrophy split. Push, pull, and leg days rotating across the week.',
    goalTags: ['MUSCLE_GAIN'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Push', days: [{ dayNumber: 1, label: 'Push A' }, { dayNumber: 4, label: 'Push B' }] },
      { label: 'Pull', days: [{ dayNumber: 2, label: 'Pull A' }, { dayNumber: 5, label: 'Pull B' }] },
      { label: 'Legs', days: [{ dayNumber: 3, label: 'Legs A' }, { dayNumber: 6, label: 'Legs B' }] },
    ],
  },
  {
    name: 'Upper Lower',
    splitType: 'UPPER_LOWER',
    daysPerWeek: 4,
    description: 'Balanced upper and lower body split. Good frequency for intermediate lifters.',
    goalTags: ['MUSCLE_GAIN', 'STRENGTH'],
    experienceTags: ['INTERMEDIATE'],
    splits: [
      { label: 'Upper', days: [{ dayNumber: 1, label: 'Upper A' }, { dayNumber: 3, label: 'Upper B' }] },
      { label: 'Lower', days: [{ dayNumber: 2, label: 'Lower A' }, { dayNumber: 4, label: 'Lower B' }] },
    ],
  },
  {
    name: 'Full Body',
    splitType: 'FULL_BODY',
    daysPerWeek: 3,
    description: 'Three full-body sessions per week. Ideal for beginners or when training time is limited.',
    goalTags: ['MUSCLE_GAIN', 'MAINTAIN'],
    experienceTags: ['BEGINNER'],
    splits: [
      { label: 'Full Body', days: [{ dayNumber: 1, label: 'Day 1' }, { dayNumber: 3, label: 'Day 2' }, { dayNumber: 5, label: 'Day 3' }] },
    ],
  },
  {
    name: 'Powerlifting',
    splitType: 'POWERLIFTING',
    daysPerWeek: 4,
    description: 'Built around the squat, bench, and deadlift. Heavy compounds, low rep ranges, long rest periods.',
    goalTags: ['STRENGTH'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Squat', days: [{ dayNumber: 1, label: 'Squat Day' }, { dayNumber: 4, label: 'Squat Volume' }] },
      { label: 'Bench', days: [{ dayNumber: 2, label: 'Bench Day' }, { dayNumber: 5, label: 'Bench Volume' }] },
      { label: 'Deadlift', days: [{ dayNumber: 3, label: 'Deadlift Day' }] },
    ],
  },
  {
    name: 'Powerbuilding',
    splitType: 'POWERBUILDING',
    daysPerWeek: 4,
    description: 'Combines heavy compound strength work with hypertrophy accessory volume. Best of both worlds.',
    goalTags: ['STRENGTH', 'MUSCLE_GAIN'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Upper Power', days: [{ dayNumber: 1, label: 'Upper Power' }] },
      { label: 'Lower Power', days: [{ dayNumber: 2, label: 'Lower Power' }] },
      { label: 'Upper Hypertrophy', days: [{ dayNumber: 4, label: 'Upper Volume' }] },
      { label: 'Lower Hypertrophy', days: [{ dayNumber: 5, label: 'Lower Volume' }] },
    ],
  },
  {
    name: 'Glute Focus',
    splitType: 'GLUTE_FOCUS',
    daysPerWeek: 4,
    description: 'Maximum glute stimulus across the week. Hip thrusts, cable work, and isolation paired with full lower body sessions.',
    goalTags: ['MUSCLE_GAIN'],
    experienceTags: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Glute Primary', days: [{ dayNumber: 1, label: 'Glute A' }, { dayNumber: 4, label: 'Glute B' }] },
      { label: 'Lower Body', days: [{ dayNumber: 2, label: 'Legs' }] },
      { label: 'Upper Body', days: [{ dayNumber: 3, label: 'Upper' }] },
    ],
  },
  {
    name: 'Quadzilla',
    splitType: 'QUAD_FOCUS',
    daysPerWeek: 4,
    description: 'Quad-dominant lower body programming. High frequency squatting, leg press, and extension work.',
    goalTags: ['MUSCLE_GAIN'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Quad Primary', days: [{ dayNumber: 1, label: 'Quad A' }, { dayNumber: 3, label: 'Quad B' }] },
      { label: 'Upper', days: [{ dayNumber: 2, label: 'Upper A' }, { dayNumber: 5, label: 'Upper B' }] },
    ],
  },
  {
    name: 'Chest Focus',
    splitType: 'CHEST_FOCUS',
    daysPerWeek: 4,
    description: 'Twice-weekly chest sessions with full upper body coverage. Flat, incline, and cable work prioritised.',
    goalTags: ['MUSCLE_GAIN'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Chest Primary', days: [{ dayNumber: 1, label: 'Chest A' }, { dayNumber: 4, label: 'Chest B' }] },
      { label: 'Back', days: [{ dayNumber: 2, label: 'Back Day' }] },
      { label: 'Legs', days: [{ dayNumber: 3, label: 'Legs Day' }] },
    ],
  },
  {
    name: 'Shoulder Focus',
    splitType: 'SHOULDER_FOCUS',
    daysPerWeek: 4,
    description: 'Rear, side, and front delt work programmed for full shoulder development with pressing and isolation.',
    goalTags: ['MUSCLE_GAIN'],
    experienceTags: ['INTERMEDIATE', 'ADVANCED'],
    splits: [
      { label: 'Shoulder Primary', days: [{ dayNumber: 1, label: 'Shoulders A' }, { dayNumber: 4, label: 'Shoulders B' }] },
      { label: 'Push', days: [{ dayNumber: 2, label: 'Push Day' }] },
      { label: 'Pull + Legs', days: [{ dayNumber: 3, label: 'Pull + Legs' }] },
    ],
  },
]

  const splitTypeListRaw = process.env.SEED_SPLIT_TYPES
  if (!splitTypeListRaw) {
    throw new Error(
      'Split type list required before split seeding. Re-run with SEED_SPLIT_TYPES="PPL,UPPER_LOWER,FULL_BODY" (comma-separated). No split records were written.',
    )
  }
  const requestedSplitTypes = new Set(
    splitTypeListRaw
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0),
  )
  if (requestedSplitTypes.size === 0) {
    throw new Error(
      'SEED_SPLIT_TYPES was provided but empty after parsing. Provide at least one split type before split seeding.',
    )
  }
  const templateDefsToSeed = templateDefs.filter((template) =>
    requestedSplitTypes.has(template.splitType.toUpperCase()),
  )

for (const t of templateDefsToSeed) {
  const existing = await prisma.splitTemplate.findUnique({ where: { name: t.name } })
  const defaultSlug = t.name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')
  const defaultPrimaryMuscle = t.splitType.includes('PPL')
    ? 'Push'
    : t.splitType.includes('UPPER')
      ? 'Upper'
      : t.splitType.includes('FULL')
        ? 'Full Body'
        : 'Balanced'
  if (!existing) {
    const template = await prisma.splitTemplate.create({
      data: {
        slug: `LEGACY-${defaultSlug}`,
        name: t.name,
        level: 'INTERMEDIATE',
        goal: 'HYPERTROPHY',
        primaryMuscle: defaultPrimaryMuscle,
        isSystem: true,
        splitLabel: t.splits[0]?.label ?? t.name,
        splitType: t.splitType,
        daysPerWeek: t.daysPerWeek,
        description: t.description ?? null,
        goalTags: t.goalTags ?? ['MUSCLE_GAIN'],
        experienceTags: t.experienceTags ?? ['INTERMEDIATE'],
      },
    })
    for (const split of t.splits) {
      for (const day of split.days) {
        await prisma.splitDay.create({
          data: {
            splitTemplateId: template.id,
            dayNumber: day.dayNumber,
            dayType: 'WORKOUT',
            label: day.label,
          },
        })
      }
    }
    console.log(`Seeded template: ${t.name}`)
  }
}

  const workoutTemplates: WorkoutTemplateSeed[] = [
    {
      name: 'Push Pull Legs',
      splitType: 'PPL',
      daysPerWeek: 6,
      splitLabel: 'PPL 6-Day',
      days: [
        {
          dayNumber: 1,
          label: 'Day 1 - Push',
          exercises: [
            { name: 'Barbell Bench Press', setsTarget: 3, repRangeMin: 6, repRangeMax: 8 },
            { name: 'Dumbbell Incline Press', setsTarget: 3, repRangeMin: 8, repRangeMax: 10 },
            { name: 'Machine Shoulder Press', setsTarget: 3, repRangeMin: 8, repRangeMax: 10 },
            { name: 'Cable Lateral Raise', setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Cable Rope Pushdown', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 2,
          label: 'Day 2 - Pull',
          exercises: [
            { name: 'Lat Pulldown', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Chest-Supported Row', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Face Pull', setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Incline Dumbbell Curl', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Cable Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 3,
          label: 'Day 3 - Legs',
          exercises: [
            { name: 'Barbell Back Squat', setsTarget: 3, repRangeMin: 5, repRangeMax: 8 },
            { name: 'Romanian Deadlift', setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
            { name: 'Leg Press', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Leg Extension', setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Seated Leg Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Seated Calf Raise', setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
          ],
        },
        {
          dayNumber: 4,
          label: 'Day 4 - Push',
          exercises: [
            { name: 'Machine Chest Press', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Barbell Overhead Press', setsTarget: 3, repRangeMin: 6, repRangeMax: 8 },
            { name: 'Pec Deck', setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Dumbbell Lateral Raise', setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
            { name: 'Overhead Tricep Extension', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 5,
          label: 'Day 5 - Pull',
          exercises: [
            { name: 'Barbell Row', setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
            { name: 'Wide Grip Lat Pulldown', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Rear Delt Machine Fly', setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
            { name: 'Hammer Curl', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Cable Rope Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 6,
          label: 'Day 6 - Legs',
          exercises: [
            { name: 'Hack Squat', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Hip Thrust', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Bulgarian Split Squat', setsTarget: 2, repRangeMin: 10, repRangeMax: 12 },
            { name: 'Leg Curl', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Calf Raise', setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
          ],
        },
      ],
    },
    {
      name: 'Upper Lower',
      splitType: 'UPPER_LOWER',
      daysPerWeek: 4,
      splitLabel: 'Upper Lower 4-Day',
      days: [
        {
          dayNumber: 1,
          label: 'Day 1 - Upper',
          exercises: [
            { name: 'Barbell Bench Press', setsTarget: 3, repRangeMin: 6, repRangeMax: 8 },
            { name: 'Chest-Supported Row', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Lat Pulldown', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Dumbbell Shoulder Press', setsTarget: 2, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Cable Lateral Raise', setsTarget: 2, repRangeMin: 12, repRangeMax: 20 },
            { name: 'Tricep Pushdown', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Barbell Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 2,
          label: 'Day 2 - Lower',
          exercises: [
            { name: 'Barbell Back Squat', setsTarget: 3, repRangeMin: 5, repRangeMax: 8 },
            { name: 'Romanian Deadlift', setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
            { name: 'Leg Press', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Leg Extension', setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Seated Leg Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Seated Calf Raise', setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
          ],
        },
        {
          dayNumber: 3,
          label: 'Day 3 - Upper',
          exercises: [
            { name: 'Machine Incline Press', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Barbell Row', setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
            { name: 'Wide Grip Lat Pulldown', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Arnold Press', setsTarget: 2, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Face Pull', setsTarget: 2, repRangeMin: 12, repRangeMax: 20 },
            { name: 'Overhead Tricep Extension', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Hammer Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 4,
          label: 'Day 4 - Lower',
          exercises: [
            { name: 'Hack Squat', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Hip Thrust', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Bulgarian Split Squat', setsTarget: 2, repRangeMin: 10, repRangeMax: 12 },
            { name: 'Leg Curl', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Cable Kickback', setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Calf Raise', setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
          ],
        },
      ],
    },
    {
      name: 'Full Body',
      splitType: 'FULL_BODY',
      daysPerWeek: 3,
      splitLabel: 'Full Body 3-Day',
      days: [
        {
          dayNumber: 1,
          label: 'Day 1 - Full Body',
          exercises: [
            { name: 'Barbell Back Squat', setsTarget: 3, repRangeMin: 5, repRangeMax: 8 },
            { name: 'Barbell Bench Press', setsTarget: 3, repRangeMin: 6, repRangeMax: 8 },
            { name: 'Lat Pulldown', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Dumbbell Lateral Raise', setsTarget: 2, repRangeMin: 12, repRangeMax: 20 },
            { name: 'Cable Rope Pushdown', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Dumbbell Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 2,
          label: 'Day 2 - Full Body',
          exercises: [
            { name: 'Romanian Deadlift', setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
            { name: 'Dumbbell Incline Press', setsTarget: 3, repRangeMin: 8, repRangeMax: 10 },
            { name: 'Cable Row', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Leg Extension', setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
            { name: 'Face Pull', setsTarget: 2, repRangeMin: 12, repRangeMax: 20 },
            { name: 'Hammer Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
        {
          dayNumber: 3,
          label: 'Day 3 - Full Body',
          exercises: [
            { name: 'Leg Press', setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Machine Chest Press', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Chest-Supported Row', setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Machine Shoulder Press', setsTarget: 2, repRangeMin: 8, repRangeMax: 12 },
            { name: 'Seated Leg Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Tricep Pushdown', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
            { name: 'Cable Curl', setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
          ],
        },
      ],
    },
  ]

  const templateExerciseNames = Array.from(new Set(
    workoutTemplates.flatMap((template) =>
      template.days.flatMap((day) => day.exercises.map((exercise) => exercise.name)),
    ),
  ))

  const templateExercises = await prisma.exercise.findMany({
    where: {
      name: {
        in: templateExerciseNames,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const exerciseIdByName = new Map(templateExercises.map((exercise) => [exercise.name, exercise.id]))
  const missingExercises = templateExerciseNames.filter((name) => !exerciseIdByName.has(name))

  if (missingExercises.length > 0) {
    throw new Error(`Missing template exercises: ${missingExercises.join(', ')}`)
  }

  const workoutTemplatesToSeed = workoutTemplates.filter((template) =>
    requestedSplitTypes.has(template.splitType.toUpperCase()),
  )

  for (const templateSeed of workoutTemplatesToSeed) {
    const templateSlug = `LEGACY-${templateSeed.name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`
    const templatePrimaryMuscle = templateSeed.splitType.includes('PPL')
      ? 'Push'
      : templateSeed.splitType.includes('UPPER')
        ? 'Upper'
        : templateSeed.splitType.includes('FULL')
          ? 'Full Body'
          : 'Balanced'
    const template = await prisma.splitTemplate.upsert({
      where: { name: templateSeed.name },
      update: {
        slug: templateSlug,
        level: 'INTERMEDIATE',
        goal: 'HYPERTROPHY',
        primaryMuscle: templatePrimaryMuscle,
        isSystem: true,
        splitLabel: templateSeed.splitLabel,
        splitType: templateSeed.splitType,
        daysPerWeek: templateSeed.daysPerWeek,
        description: null,
        goalTags: ['MUSCLE_GAIN'],
        experienceTags: ['INTERMEDIATE'],
      },
      create: {
        slug: templateSlug,
        name: templateSeed.name,
        level: 'INTERMEDIATE',
        goal: 'HYPERTROPHY',
        primaryMuscle: templatePrimaryMuscle,
        isSystem: true,
        splitLabel: templateSeed.splitLabel,
        splitType: templateSeed.splitType,
        daysPerWeek: templateSeed.daysPerWeek,
        description: null,
        goalTags: ['MUSCLE_GAIN'],
        experienceTags: ['INTERMEDIATE'],
      },
    })

    const existingSplitDays = await prisma.splitDay.findMany({
      where: { splitTemplateId: template.id },
      select: { id: true },
    })

    const existingSplitDayIds = existingSplitDays.map((splitDay) => splitDay.id)

    if (existingSplitDayIds.length > 0) {
      await prisma.splitDayExercise.deleteMany({
        where: {
          splitDayId: {
            in: existingSplitDayIds,
          },
        },
      })
    }

    await prisma.splitDay.deleteMany({
      where: {
        splitTemplateId: template.id,
      },
    })

    await prisma.splitTemplate.update({
      where: { id: template.id },
      data: {
        days: {
          create: templateSeed.days.map((day) => ({
            dayNumber: day.dayNumber,
            dayType: 'WORKOUT',
            label: day.label,
            exercises: {
              create: day.exercises.map((exercise, index) => ({
                exerciseId: exerciseIdByName.get(exercise.name)!,
                orderIndex: index + 1,
                setsTarget: exercise.setsTarget,
                repRangeMin: exercise.repRangeMin,
                repRangeMax: exercise.repRangeMax,
              })),
            },
          })),
        },
      },
    })
  }
  }

  const devPassword = process.env.DEV_SEED_PASSWORD ?? 'DevPass123!'
  const passwordHash = await bcrypt.hash(devPassword, 10)
  const devUsers = [
    {
      email: 'dev@kinetiq.local',
      displayName: 'Dev Athlete',
      goalMode: 'MUSCLE_GAIN',
      experienceLevel: 'INTERMEDIATE',
      trainingAgeMths: 24,
      onboardingCompletedAt: new Date(),
    },
    {
      email: 'coach@kinetiq.local',
      displayName: 'Dev Coach',
      goalMode: 'STRENGTH',
      experienceLevel: 'ADVANCED',
      trainingAgeMths: 72,
      onboardingCompletedAt: new Date(),
    },
  ] as const

  for (const user of devUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        goalMode: user.goalMode,
        experienceLevel: user.experienceLevel,
        trainingAgeMths: user.trainingAgeMths,
        onboardingCompletedAt: user.onboardingCompletedAt,
        emailVerified: true,
      },
      create: {
        email: user.email,
        passwordHash,
        displayName: user.displayName,
        goalMode: user.goalMode,
        experienceLevel: user.experienceLevel,
        trainingAgeMths: user.trainingAgeMths,
        onboardingCompletedAt: user.onboardingCompletedAt,
        emailVerified: true,
      },
    })
  }

  console.log(`Seed complete — ${exercises.length} exercises loaded`)
  console.log(
    `Seeded dev users: ${devUsers.map((user) => user.email).join(', ')} (password: ${devPassword})`,
  )
}

main().catch(console.error).finally(() => prisma.$disconnect())
