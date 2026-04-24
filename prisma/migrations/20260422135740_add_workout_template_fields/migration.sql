/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `WorkoutTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `goal` to the `WorkoutTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `WorkoutTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryMuscle` to the `WorkoutTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `WorkoutTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WorkoutTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('NOVICE', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TrainingGoal" AS ENUM ('HYPERTROPHY', 'STRENGTH', 'POWERBUILDING', 'POWERLIFTING');

-- CreateEnum
CREATE TYPE "SplitStyle" AS ENUM ('PPL', 'UPPER_LOWER', 'FULL_BODY', 'BODY_PART', 'HYBRID', 'SPECIALIZED');

-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "experienceTags" TEXT[],
ADD COLUMN     "goal" "TrainingGoal" NOT NULL,
ADD COLUMN     "goalTags" TEXT[],
ADD COLUMN     "level" "ExperienceLevel" NOT NULL,
ADD COLUMN     "primaryMuscle" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "TemplateSlot" (
    "id" TEXT NOT NULL,
    "workoutTemplateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "slotLabel" TEXT NOT NULL,
    "setsMin" INTEGER NOT NULL,
    "setsMax" INTEGER NOT NULL,
    "repsMin" INTEGER NOT NULL,
    "repsMax" INTEGER NOT NULL,
    "rpeMin" DOUBLE PRECISION NOT NULL,
    "rpeMax" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "TemplateSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MesocycleTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "ExperienceLevel" NOT NULL,
    "goal" "TrainingGoal" NOT NULL,
    "splitStyle" "SplitStyle" NOT NULL,
    "primaryFocus" TEXT NOT NULL,
    "durationWeeksMin" INTEGER NOT NULL,
    "durationWeeksMax" INTEGER NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "progressionType" TEXT NOT NULL,
    "progressionNotes" TEXT,
    "deloadWeek" INTEGER,
    "deloadNotes" TEXT,
    "difficultyWarning" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MesocycleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplateDay" (
    "id" TEXT NOT NULL,
    "mesocycleTemplateId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "workoutTemplateId" TEXT,

    CONSTRAINT "WorkoutTemplateDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateSlot_workoutTemplateId_order_idx" ON "TemplateSlot"("workoutTemplateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "MesocycleTemplate_slug_key" ON "MesocycleTemplate"("slug");

-- CreateIndex
CREATE INDEX "MesocycleTemplate_level_goal_splitStyle_idx" ON "MesocycleTemplate"("level", "goal", "splitStyle");

-- CreateIndex
CREATE INDEX "WorkoutTemplateDay_mesocycleTemplateId_dayNumber_idx" ON "WorkoutTemplateDay"("mesocycleTemplateId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutTemplateDay_mesocycleTemplateId_dayNumber_key" ON "WorkoutTemplateDay"("mesocycleTemplateId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutTemplate_slug_key" ON "WorkoutTemplate"("slug");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_level_goal_idx" ON "WorkoutTemplate"("level", "goal");

-- AddForeignKey
ALTER TABLE "Mesocycle" ADD CONSTRAINT "Mesocycle_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MesocycleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSlot" ADD CONSTRAINT "TemplateSlot_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplateDay" ADD CONSTRAINT "WorkoutTemplateDay_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplateDay" ADD CONSTRAINT "WorkoutTemplateDay_mesocycleTemplateId_fkey" FOREIGN KEY ("mesocycleTemplateId") REFERENCES "MesocycleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
