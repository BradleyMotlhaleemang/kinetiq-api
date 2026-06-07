/**
 * Delete a user and all associated data from the local database.
 *
 * Use this to reset your own test account so you can re-run registration / login
 * flows without running SQL manually. Safe for local dev only — never point this
 * at a shared or production database.
 *
 * Usage (from kinetiq-api/):
 *   npm run delete-user -- you@example.com
 *
 * Examples for collaborators:
 *   npm run delete-user -- bmuzimo@gmail.com
 *   npm run delete-user -- dev.test@yourcompany.com
 *
 * After running:
 *   1. Clear browser sessionStorage / cookies (or use Incognito)
 *   2. Register again with the same email, verify via email, then sign in
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter } as any);

async function deleteUserData(userId: string) {
  const workoutIds = (
    await prisma.workout.findMany({ where: { userId }, select: { id: true } })
  ).map((w) => w.id);

  const bioFeedbackIds = (
    await prisma.bioFeedback.findMany({ where: { userId }, select: { id: true } })
  ).map((b) => b.id);

  const userSplitTemplateIds = (
    await prisma.splitTemplate.findMany({
      where: { userId, isSystem: false },
      select: { id: true },
    })
  ).map((t) => t.id);

  const userSplitDayIds =
    userSplitTemplateIds.length > 0
      ? (
          await prisma.splitDay.findMany({
            where: { splitTemplateId: { in: userSplitTemplateIds } },
            select: { id: true },
          })
        ).map((d) => d.id)
      : [];

  if (bioFeedbackIds.length > 0) {
    await prisma.muscleGroupFeedback.deleteMany({
      where: { bioFeedbackId: { in: bioFeedbackIds } },
    });
  }

  if (workoutIds.length > 0) {
    await prisma.setRestLog.deleteMany({ where: { workoutId: { in: workoutIds } } });
    await prisma.set.deleteMany({ where: { workoutId: { in: workoutIds } } });
    await prisma.workoutExercise.deleteMany({ where: { workoutId: { in: workoutIds } } });
    await prisma.sessionReadiness.deleteMany({ where: { workoutId: { in: workoutIds } } });
    await prisma.performanceHistory.deleteMany({ where: { workoutId: { in: workoutIds } } });
    await prisma.pRRecord.deleteMany({ where: { workoutId: { in: workoutIds } } });
    await prisma.bioFeedback.deleteMany({ where: { workoutId: { in: workoutIds } } });
  }

  await prisma.muscleGroupFeedback.deleteMany({ where: { userId } });
  await prisma.setRestLog.deleteMany({ where: { userId } });
  await prisma.sessionReadiness.deleteMany({ where: { userId } });
  await prisma.performanceHistory.deleteMany({ where: { userId } });
  await prisma.pRRecord.deleteMany({ where: { userId } });
  await prisma.bioFeedback.deleteMany({ where: { userId } });
  await prisma.workout.deleteMany({ where: { userId } });
  await prisma.weeklyFeedback.deleteMany({ where: { userId } });
  await prisma.mesocycle.deleteMany({ where: { userId } });
  await prisma.progressionLog.deleteMany({ where: { userId } });
  await prisma.plateauMarker.deleteMany({ where: { userId } });
  await prisma.exerciseSubstitution.deleteMany({ where: { userId } });
  await prisma.bodyMetricLog.deleteMany({ where: { userId } });
  await prisma.notificationLog.deleteMany({ where: { userId } });
  await prisma.fatigueSnapshot.deleteMany({ where: { userId } });
  await prisma.cardioSession.deleteMany({ where: { userId } });
  await prisma.foodLog.deleteMany({ where: { userId } });
  await prisma.nutritionTarget.deleteMany({ where: { userId } });
  await prisma.supplementLog.deleteMany({ where: { userId } });
  await prisma.userExerciseSFR.deleteMany({ where: { userId } });
  await prisma.restPreference.deleteMany({ where: { userId } });

  if (userSplitDayIds.length > 0) {
    await prisma.splitDayExercise.deleteMany({
      where: { splitDayId: { in: userSplitDayIds } },
    });
    await prisma.splitDay.deleteMany({ where: { id: { in: userSplitDayIds } } });
  }

  if (userSplitTemplateIds.length > 0) {
    await prisma.splitTemplate.deleteMany({ where: { id: { in: userSplitTemplateIds } } });
  }

  await prisma.user.delete({ where: { id: userId } });
}

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('Usage: npm run delete-user -- <email>');
    console.error('Example: npm run delete-user -- you@example.com');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      _count: { select: { mesocycles: true, workouts: true } },
    },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Deleting user: ${user.email} (${user.displayName})`);
  console.log(`  mesocycles: ${user._count.mesocycles}, workouts: ${user._count.workouts}`);

  await deleteUserData(user.id);

  console.log(`Done. User "${email}" and all related data removed.`);
  console.log('Next: clear browser sessionStorage/cookies, then register or sign in again.');
}

main()
  .catch((err) => {
    console.error('Delete failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
