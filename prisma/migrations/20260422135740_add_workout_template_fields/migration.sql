DO $$ BEGIN
  CREATE TYPE "ExperienceLevel" AS ENUM ('NOVICE', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TrainingGoal" AS ENUM ('HYPERTROPHY', 'STRENGTH', 'POWERBUILDING', 'POWERLIFTING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SplitStyle" AS ENUM ('PPL', 'UPPER_LOWER', 'FULL_BODY', 'BODY_PART', 'HYBRID', 'SPECIALIZED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "WorkoutTemplate"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "experienceTags" TEXT[],
  ADD COLUMN IF NOT EXISTS "goal" "TrainingGoal",
  ADD COLUMN IF NOT EXISTS "goalTags" TEXT[],
  ADD COLUMN IF NOT EXISTS "level" "ExperienceLevel",
  ADD COLUMN IF NOT EXISTS "primaryMuscle" TEXT,
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "WorkoutTemplate"
SET
  "slug" = COALESCE("slug", regexp_replace(upper("name"), '[^A-Z0-9]+', '-', 'g')),
  "level" = COALESCE("level", 'INTERMEDIATE'::"ExperienceLevel"),
  "goal" = COALESCE("goal", 'HYPERTROPHY'::"TrainingGoal"),
  "primaryMuscle" = COALESCE("primaryMuscle", 'Balanced'),
  "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE
  "slug" IS NULL
  OR "level" IS NULL
  OR "goal" IS NULL
  OR "primaryMuscle" IS NULL
  OR "updatedAt" IS NULL;

ALTER TABLE "WorkoutTemplate"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "level" SET NOT NULL,
  ALTER COLUMN "goal" SET NOT NULL,
  ALTER COLUMN "primaryMuscle" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "TemplateSlot" (
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

CREATE TABLE IF NOT EXISTS "MesocycleTemplate" (
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

CREATE TABLE IF NOT EXISTS "WorkoutTemplateDay" (
  "id" TEXT NOT NULL,
  "mesocycleTemplateId" TEXT NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "isRestDay" BOOLEAN NOT NULL DEFAULT false,
  "workoutTemplateId" TEXT,
  CONSTRAINT "WorkoutTemplateDay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TemplateSlot_workoutTemplateId_order_idx" ON "TemplateSlot"("workoutTemplateId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "MesocycleTemplate_slug_key" ON "MesocycleTemplate"("slug");
CREATE INDEX IF NOT EXISTS "MesocycleTemplate_level_goal_splitStyle_idx" ON "MesocycleTemplate"("level", "goal", "splitStyle");
CREATE INDEX IF NOT EXISTS "WorkoutTemplateDay_mesocycleTemplateId_dayNumber_idx" ON "WorkoutTemplateDay"("mesocycleTemplateId", "dayNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkoutTemplateDay_mesocycleTemplateId_dayNumber_key" ON "WorkoutTemplateDay"("mesocycleTemplateId", "dayNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkoutTemplate_slug_key" ON "WorkoutTemplate"("slug");
CREATE INDEX IF NOT EXISTS "WorkoutTemplate_level_goal_idx" ON "WorkoutTemplate"("level", "goal");

UPDATE "Mesocycle" m
SET "templateId" = NULL
WHERE "templateId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "MesocycleTemplate" mt
    WHERE mt."id" = m."templateId"
  );

DO $$ BEGIN
  ALTER TABLE "Mesocycle"
    ADD CONSTRAINT "Mesocycle_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "MesocycleTemplate"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TemplateSlot"
    ADD CONSTRAINT "TemplateSlot_workoutTemplateId_fkey"
    FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WorkoutTemplateDay"
    ADD CONSTRAINT "WorkoutTemplateDay_workoutTemplateId_fkey"
    FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WorkoutTemplateDay"
    ADD CONSTRAINT "WorkoutTemplateDay_mesocycleTemplateId_fkey"
    FOREIGN KEY ("mesocycleTemplateId") REFERENCES "MesocycleTemplate"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
