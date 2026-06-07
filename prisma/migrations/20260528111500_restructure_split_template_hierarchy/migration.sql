-- Safe restructure migration with backfill for existing rows.
-- Handles orphaned enums from a prior failed attempt.

DO $$ BEGIN
  CREATE TYPE "DayType" AS ENUM ('WORKOUT', 'REST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SessionType" AS ENUM ('MESOCYCLE', 'SPLIT', 'STANDALONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DropForeignKey
ALTER TABLE "Mesocycle" DROP CONSTRAINT IF EXISTS "Mesocycle_templateId_fkey";
ALTER TABLE "SplitConfig" DROP CONSTRAINT IF EXISTS "SplitConfig_templateId_fkey";
ALTER TABLE "SplitDay" DROP CONSTRAINT IF EXISTS "SplitDay_splitConfigId_fkey";
ALTER TABLE "TemplateSlot" DROP CONSTRAINT IF EXISTS "TemplateSlot_workoutTemplateId_fkey";
ALTER TABLE "WorkoutTemplateDay" DROP CONSTRAINT IF EXISTS "WorkoutTemplateDay_mesocycleTemplateId_fkey";
ALTER TABLE "WorkoutTemplateDay" DROP CONSTRAINT IF EXISTS "WorkoutTemplateDay_workoutTemplateId_fkey";
ALTER TABLE "SplitDayExercise" DROP CONSTRAINT IF EXISTS "SplitDayExercise_exerciseId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "MesocycleTemplate_level_goal_splitStyle_idx";

-- Create target tables before altering dependents
CREATE TABLE IF NOT EXISTS "SplitTemplate" (
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

CREATE TABLE IF NOT EXISTS "WorkoutExercise" (
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

-- Copy legacy workout templates into split templates (preserve ids)
INSERT INTO "SplitTemplate" (
    "id", "userId", "slug", "name", "level", "goal", "primaryMuscle",
    "isSystem", "splitLabel", "splitType", "daysPerWeek", "description",
    "goalTags", "experienceTags", "createdAt", "updatedAt"
)
SELECT
    wt."id",
    NULL,
    wt."slug",
    wt."name",
    wt."level",
    wt."goal",
    wt."primaryMuscle",
    true,
    wt."name",
    wt."splitType",
    wt."daysPerWeek",
    wt."description",
    COALESCE(wt."goalTags", ARRAY[]::TEXT[]),
    COALESCE(wt."experienceTags", ARRAY[]::TEXT[]),
    wt."createdAt",
    wt."updatedAt"
FROM "WorkoutTemplate" wt
ON CONFLICT ("id") DO NOTHING;

-- Fallback split for orphan mesocycles / unmapped templates
INSERT INTO "SplitTemplate" (
    "id", "slug", "name", "level", "goal", "primaryMuscle",
    "isSystem", "splitLabel", "splitType", "daysPerWeek",
    "goalTags", "experienceTags", "createdAt", "updatedAt"
)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'legacy-fallback-split',
    'Legacy Fallback Split',
    'INTERMEDIATE',
    'HYPERTROPHY',
    'Balanced',
    true,
    'Legacy Fallback Split',
    'FULL_BODY',
    3,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- MesocycleTemplate: add splitTemplateId, backfill, then drop legacy columns
ALTER TABLE "MesocycleTemplate"
  ADD COLUMN IF NOT EXISTS "splitTemplateId" TEXT;

UPDATE "MesocycleTemplate" mt
SET "splitTemplateId" = matched."splitTemplateId"
FROM (
  SELECT
    mt2."id" AS "mesocycleTemplateId",
    COALESCE(
      (
        SELECT wt."id"
        FROM "WorkoutTemplate" wt
        INNER JOIN "SplitConfig" sc ON sc."templateId" = wt."id"
        WHERE wt."daysPerWeek" = mt2."daysPerWeek"
        ORDER BY wt."createdAt"
        LIMIT 1
      ),
      (
        SELECT wt."id"
        FROM "WorkoutTemplate" wt
        WHERE wt."daysPerWeek" = mt2."daysPerWeek"
        ORDER BY wt."createdAt"
        LIMIT 1
      ),
      '00000000-0000-4000-8000-000000000001'
    ) AS "splitTemplateId"
  FROM "MesocycleTemplate" mt2
) matched
WHERE mt."id" = matched."mesocycleTemplateId"
  AND mt."splitTemplateId" IS NULL;

UPDATE "MesocycleTemplate"
SET "splitTemplateId" = '00000000-0000-4000-8000-000000000001'
WHERE "splitTemplateId" IS NULL;

ALTER TABLE "MesocycleTemplate" DROP COLUMN IF EXISTS "daysPerWeek";
ALTER TABLE "MesocycleTemplate" DROP COLUMN IF EXISTS "primaryFocus";
ALTER TABLE "MesocycleTemplate" DROP COLUMN IF EXISTS "splitStyle";
ALTER TABLE "MesocycleTemplate" ALTER COLUMN "splitTemplateId" SET NOT NULL;

-- SplitDay: add new columns, backfill from SplitConfig, drop legacy link
ALTER TABLE "SplitDay"
  ADD COLUMN IF NOT EXISTS "dayType" "DayType",
  ADD COLUMN IF NOT EXISTS "splitTemplateId" TEXT;

UPDATE "SplitDay" sd
SET "splitTemplateId" = sc."templateId"
FROM "SplitConfig" sc
WHERE sd."splitConfigId" = sc."id"
  AND sd."splitTemplateId" IS NULL;

UPDATE "SplitDay"
SET "splitTemplateId" = '00000000-0000-4000-8000-000000000001'
WHERE "splitTemplateId" IS NULL;

UPDATE "SplitDay"
SET "dayType" = 'WORKOUT'::"DayType"
WHERE "dayType" IS NULL;

ALTER TABLE "SplitDay" DROP COLUMN IF EXISTS "splitConfigId";
ALTER TABLE "SplitDay" ALTER COLUMN "dayType" SET NOT NULL;
ALTER TABLE "SplitDay" ALTER COLUMN "splitTemplateId" SET NOT NULL;

-- Mesocycle: rename templateId -> mesocycleTemplateId, require splitTemplateId
ALTER TABLE "Mesocycle"
  ADD COLUMN IF NOT EXISTS "mesocycleTemplateId" TEXT,
  ADD COLUMN IF NOT EXISTS "splitTemplateId" TEXT;

UPDATE "Mesocycle"
SET "mesocycleTemplateId" = "templateId"
WHERE "mesocycleTemplateId" IS NULL;

UPDATE "Mesocycle" m
SET "splitTemplateId" = COALESCE(
  (
    SELECT mt."splitTemplateId"
    FROM "MesocycleTemplate" mt
    WHERE mt."id" = m."mesocycleTemplateId"
  ),
  '00000000-0000-4000-8000-000000000001'
)
WHERE m."splitTemplateId" IS NULL;

ALTER TABLE "Mesocycle" DROP COLUMN IF EXISTS "templateId";
ALTER TABLE "Mesocycle" ALTER COLUMN "splitTemplateId" SET NOT NULL;

-- Workout: migrate sessionType text -> SessionType enum
ALTER TABLE "Workout"
  ADD COLUMN IF NOT EXISTS "splitDayId" TEXT,
  ADD COLUMN IF NOT EXISTS "splitTemplateId" TEXT,
  ADD COLUMN IF NOT EXISTS "sessionType_new" "SessionType";

UPDATE "Workout"
SET "sessionType_new" = CASE
  WHEN "mesocycleId" IS NOT NULL THEN 'MESOCYCLE'::"SessionType"
  ELSE 'STANDALONE'::"SessionType"
END
WHERE "sessionType_new" IS NULL;

ALTER TABLE "Workout" DROP COLUMN IF EXISTS "sessionType";
ALTER TABLE "Workout" RENAME COLUMN "sessionType_new" TO "sessionType";
ALTER TABLE "Workout" ALTER COLUMN "sessionType" SET NOT NULL;

-- Drop legacy tables
DROP TABLE IF EXISTS "SplitConfig";
DROP TABLE IF EXISTS "TemplateSlot";
DROP TABLE IF EXISTS "WorkoutTemplateDay";
DROP TABLE IF EXISTS "WorkoutTemplate";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SplitTemplate_slug_key" ON "SplitTemplate"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "SplitTemplate_name_key" ON "SplitTemplate"("name");
CREATE INDEX IF NOT EXISTS "SplitTemplate_level_goal_idx" ON "SplitTemplate"("level", "goal");
CREATE INDEX IF NOT EXISTS "WorkoutExercise_workoutId_idx" ON "WorkoutExercise"("workoutId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkoutExercise_workoutId_exerciseId_key" ON "WorkoutExercise"("workoutId", "exerciseId");
CREATE INDEX IF NOT EXISTS "MesocycleTemplate_level_goal_idx" ON "MesocycleTemplate"("level", "goal");
CREATE UNIQUE INDEX IF NOT EXISTS "Set_workoutId_exerciseId_setNumber_key" ON "Set"("workoutId", "exerciseId", "setNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "SplitDay_splitTemplateId_dayNumber_key" ON "SplitDay"("splitTemplateId", "dayNumber");

-- AddForeignKey
ALTER TABLE "SplitTemplate" DROP CONSTRAINT IF EXISTS "SplitTemplate_userId_fkey";
ALTER TABLE "SplitTemplate" ADD CONSTRAINT "SplitTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SplitDay" DROP CONSTRAINT IF EXISTS "SplitDay_splitTemplateId_fkey";
ALTER TABLE "SplitDay" ADD CONSTRAINT "SplitDay_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SplitDayExercise" ADD CONSTRAINT "SplitDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Mesocycle" DROP CONSTRAINT IF EXISTS "Mesocycle_mesocycleTemplateId_fkey";
ALTER TABLE "Mesocycle" ADD CONSTRAINT "Mesocycle_mesocycleTemplateId_fkey" FOREIGN KEY ("mesocycleTemplateId") REFERENCES "MesocycleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Mesocycle" DROP CONSTRAINT IF EXISTS "Mesocycle_splitTemplateId_fkey";
ALTER TABLE "Mesocycle" ADD CONSTRAINT "Mesocycle_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MesocycleTemplate" DROP CONSTRAINT IF EXISTS "MesocycleTemplate_splitTemplateId_fkey";
ALTER TABLE "MesocycleTemplate" ADD CONSTRAINT "MesocycleTemplate_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Workout" DROP CONSTRAINT IF EXISTS "Workout_splitTemplateId_fkey";
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_splitTemplateId_fkey" FOREIGN KEY ("splitTemplateId") REFERENCES "SplitTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Workout" DROP CONSTRAINT IF EXISTS "Workout_splitDayId_fkey";
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "SplitDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkoutExercise" DROP CONSTRAINT IF EXISTS "WorkoutExercise_workoutId_fkey";
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutExercise" DROP CONSTRAINT IF EXISTS "WorkoutExercise_exerciseId_fkey";
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
