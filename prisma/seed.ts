import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter } as any)

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

  console.log(`Seed complete — ${exercises.length} exercises loaded`)
}

main().catch(console.error).finally(() => prisma.$disconnect())