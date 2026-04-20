import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

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
    const created = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        movementPattern: ex.movementPattern,
        exerciseType: ex.exerciseType,
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

  // ── WORKOUT TEMPLATES ──────────────────────────────────────────
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

for (const t of templateDefs) {
  const existing = await prisma.workoutTemplate.findUnique({ where: { name: t.name } })
  if (!existing) {
    const template = await prisma.workoutTemplate.create({
      data: { name: t.name, splitType: t.splitType, daysPerWeek: t.daysPerWeek },
    })
    for (const split of t.splits) {
      const config = await prisma.splitConfig.create({
        data: { templateId: template.id, splitLabel: split.label },
      })
      for (const day of split.days) {
        await prisma.splitDay.create({
          data: { splitConfigId: config.id, dayNumber: day.dayNumber, label: day.label },
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

  for (const templateSeed of workoutTemplates) {
    const template = await prisma.workoutTemplate.upsert({
      where: { name: templateSeed.name },
      update: {
        splitType: templateSeed.splitType,
        daysPerWeek: templateSeed.daysPerWeek,
      },
      create: {
        name: templateSeed.name,
        splitType: templateSeed.splitType,
        daysPerWeek: templateSeed.daysPerWeek,
      },
    })

    const existingSplitConfigs = await prisma.splitConfig.findMany({
      where: { templateId: template.id },
      select: { id: true },
    })

    const existingSplitConfigIds = existingSplitConfigs.map((splitConfig) => splitConfig.id)

    if (existingSplitConfigIds.length > 0) {
      const existingSplitDays = await prisma.splitDay.findMany({
        where: {
          splitConfigId: {
            in: existingSplitConfigIds,
          },
        },
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
          splitConfigId: {
            in: existingSplitConfigIds,
          },
        },
      })

      await prisma.splitConfig.deleteMany({
        where: { templateId: template.id },
      })
    }

    await prisma.splitConfig.create({
      data: {
        templateId: template.id,
        splitLabel: templateSeed.splitLabel,
        days: {
          create: templateSeed.days.map((day) => ({
            dayNumber: day.dayNumber,
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

  console.log(`Seed complete — ${exercises.length} exercises loaded`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
