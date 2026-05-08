-- Standardize level enum naming
ALTER TYPE "ExperienceLevel" RENAME VALUE 'NOVICE' TO 'BEGINNER';

-- Add user classification audit fields
ALTER TABLE "User"
ADD COLUMN "classificationScore" INTEGER,
ADD COLUMN "recommendedLevel" TEXT,
ADD COLUMN "levelOverrideAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "classificationConfidence" DOUBLE PRECISION,
ADD COLUMN "classificationCompletedAt" TIMESTAMP(3);
