import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Equipment profiles
  const barbell = await prisma.equipmentProfile.upsert({
    where: { name: 'BARBELL' },
    update: {},
    create: { name: 'BARBELL', requiredEquipment: ['barbell', 'rack'] },
  });
  const dumbbell = await prisma.equipmentProfile.upsert({
    where: { name: 'DUMBBELL' },
    update: {},
    create: { name: 'DUMBBELL', requiredEquipment: ['dumbbells'] },
  });
  const cable = await prisma.equipmentProfile.upsert({
    where: { name: 'CABLE' },
    update: {},
    create: { name: 'CABLE', requiredEquipment: ['cable_machine'] },
  });
  const bodyweight = await prisma.equipmentProfile.upsert({
    where: { name: 'BODYWEIGHT' },
    update: {},
    create: { name: 'BODYWEIGHT', requiredEquipment: [] },
  });

  // Execution profiles
  const controlled = await prisma.executionProfile.upsert({
    where: { zone: 'CONTROLLED' },
    update: {},
    create: { zone: 'CONTROLLED', description: 'Slow, controlled tempo', rpeRange: '6-8', multiplier: 1.0 },
  });
  const hypertrophy = await prisma.executionProfile.upsert({
    where: { zone: 'HYPERTROPHY' },
    update: {},
    create: { zone: 'HYPERTROPHY', description: 'Moderate tempo with full stretch', rpeRange: '7-9', multiplier: 1.1 },
  });
  const performance = await prisma.executionProfile.upsert({
    where: { zone: 'PERFORMANCE' },
    update: {},
    create: { zone: 'PERFORMANCE', description: 'Explosive, intent-driven', rpeRange: '8-10', multiplier: 1.2 },
  });

  // Exercises (sample — extend to full 35)
  const exercises = [
    { name: 'Barbell Back Squat', primaryMuscle: 'QUADS', secondaryMuscles: ['GLUTES','HAMSTRINGS'], movementPattern: 'SQUAT', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 9, stabilityDemand: 1.3, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Romanian Deadlift', primaryMuscle: 'HAMSTRINGS', secondaryMuscles: ['GLUTES','LOWER_BACK'], movementPattern: 'HINGE', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 8, stabilityDemand: 1.2, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Barbell Bench Press', primaryMuscle: 'CHEST', secondaryMuscles: ['TRICEPS','FRONT_DELT'], movementPattern: 'HORIZONTAL_PUSH', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 7, stabilityDemand: 1.1, methodFatigueMultiplier: 1.0, equipment: barbell, execution: hypertrophy },
    { name: 'Pull-Up', primaryMuscle: 'LATS', secondaryMuscles: ['BICEPS','REAR_DELT'], movementPattern: 'VERTICAL_PULL', exerciseType: 'COMPOUND', isCompound: true, fatigueScore: 6, stabilityDemand: 1.0, methodFatigueMultiplier: 1.0, equipment: bodyweight, execution: hypertrophy },
    { name: 'Dumbbell Lateral Raise', primaryMuscle: 'SIDE_DELT', secondaryMuscles: [], movementPattern: 'ISOLATION', exerciseType: 'ISOLATION', isCompound: false, fatigueScore: 3, stabilityDemand: 0.8, methodFatigueMultiplier: 0.8, equipment: dumbbell, execution: controlled },
  ];

  for (const ex of exercises) {
    const created = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        name: ex.name, primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles, movementPattern: ex.movementPattern,
        exerciseType: ex.exerciseType, isCompound: ex.isCompound,
      },
    });
    await prisma.exerciseMetadata.upsert({
      where: { exerciseId: created.id },
      update: {},
      create: {
        exerciseId: created.id, fatigueScore: ex.fatigueScore,
        stabilityDemand: ex.stabilityDemand, methodFatigueMultiplier: ex.methodFatigueMultiplier,
        equipmentProfileId: ex.equipment.id, executionProfileId: ex.execution.id,
      },
    });
  }

  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());