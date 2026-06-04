-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WORKOUT', 'REST');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('MESOCYCLE', 'SPLIT', 'STANDALONE');

-- DropForeignKey
ALTER TABLE "Mesocycle" DROP CONSTRAINT "Mesocycle_templateId_fkey";

-- DropForeignKey
ALTER TABLE "SplitConfig" DROP CONSTRAINT "SplitConfig_templateId_fkey";

-- DropForeignKey
ALTER TABLE "SplitDay" DROP CONSTRAINT "SplitDay_splitConfigId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateSlot" DROP CONSTRAINT "TemplateSlot_workoutTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutTemplateDay" DROP CONSTRAINT "WorkoutTemplateDay_mesocycleTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutTemplateDay" DROP CONSTRAINT "WorkoutTemplateDay_workoutTemplateId_fkey";

-- DropIndex
DROP INDEX "MesocycleTemplate_level_goal_splitStyle_idx";

-- AlterTable
ALTER TABLE "Mesocycle" DROP COLUMN "templateId",
ADD COLUMN     "mesocycleTemplateId" TEXT,
ADD COLUMN     "splitTemplateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MesocycleTemplate" DROP COLUMN "daysPerWeek",
DROP COLUMN "primaryFocus",
DROP COLUMN "splitStyle",
ADD COLUMN     "splitTemplateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SplitDay" DROP COLUMN "splitConfigId",
ADD COLUMN     "dayType" "DayType" NOT NULL,
ADD COLUMN     "splitTemplateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "splitDayId" TEXT,
ADD COLUMN     "splitTemplateId" TEXT,
DROP COLUMN "sessionType",
ADD COLUMN     "sessionType" "SessionType" NOT NULL;

-- DropTable
DROP TABLE "SplitConfig";

-- DropTable
DROP TABLE "TemplateSlot";

-- DropTable
DROP TABLE "WorkoutTemplate";

-- DropTable
DROP TABLE "WorkoutTemplateDay";

-- CreateTable
CREATE TABLE "SplitTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "level" "ExperienceLevel" NOT NULL,
    "goal" "TrainingGoal" NOT NULL,
    "primaryMuscle" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "splitLabel" TEXT NOT NULL,
    "splitType" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "description" TEXT,
    "goalTags" TEXT[],
    "experienceTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "setsTarget" INTEGER NOT NULL,
    "repRangeMin" INTEGER NOT NULL,
    "repRangeMax" INTEGER NOT NULL,
    "sourceExerciseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitTemplate_slug_key" ON "SplitTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SplitTemplate_name_key" ON "SplitTemplate"("name");

-- CreateIndex
CREATE INDEX "SplitTemplate_level_goal_idx" ON "SplitTemplate"("level", "goal");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutId_idx" ON "WorkoutExercise"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercise_workoutId_exerciseId_key" ON "WorkoutExercise"("workoutId", "exerciseId");

-- CreateIndex
CREATE INDEX "MesocycleTemplate_level_goal_idx" ON "MesocycleTemplate"("level", "goal");

-- CreateIndex
CREATE UNIQUE INDEX "Set_workoutId_exerciseId_setNumber_key" ON "Set"("workoutId", "exerciseId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SplitDay_splitTemplateId_dayNumber_key" ON "SplitDay"("splitTemplateId", "dayNumber");

-- AddForeignKey
ALTER TABLE "SplitTemplate" ADD CONSTRAINT "SplitTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDay" ADD CONSTRAINT "SplitDay_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDayExercise" ADD CONSTRAINT "SplitDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesocycle" ADD CONSTRAINT "Mesocycle_mesocycleTemplateId_fkey" FOREIGN KEY ("mesocycleTemplateId") REFERENCES "MesocycleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesocycle" ADD CONSTRAINT "Mesocycle_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MesocycleTemplate" ADD CONSTRAINT "MesocycleTemplate_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "SplitDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
