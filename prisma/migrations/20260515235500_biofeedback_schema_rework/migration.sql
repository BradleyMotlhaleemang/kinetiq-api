-- Rename BioFeedback fields
ALTER TABLE "BioFeedback" RENAME COLUMN "jointPainLog" TO "jointComfortLog";
ALTER TABLE "BioFeedback" RENAME COLUMN "energyLevel" TO "trainingDrive";
ALTER TABLE "BioFeedback" RENAME COLUMN "strengthRating" TO "sessionPerformance";

-- Add required pumpScore and backfill existing rows
ALTER TABLE "BioFeedback" ADD COLUMN "pumpScore" INTEGER;
UPDATE "BioFeedback"
SET "pumpScore" = LEAST(GREATEST(COALESCE("effortScore", 3), 1), 5)
WHERE "pumpScore" IS NULL;
ALTER TABLE "BioFeedback" ALTER COLUMN "pumpScore" SET NOT NULL;

-- Remove deprecated BioFeedback fields
ALTER TABLE "BioFeedback" DROP COLUMN "muscleFeel";
ALTER TABLE "BioFeedback" DROP COLUMN "sleepLastNight";
ALTER TABLE "BioFeedback" DROP COLUMN "overallWellbeing";

-- Rename MuscleGroupFeedback joint comfort fields
ALTER TABLE "MuscleGroupFeedback" RENAME COLUMN "jointPain" TO "jointComfort";
ALTER TABLE "MuscleGroupFeedback" RENAME COLUMN "jointPainScore" TO "jointComfortScore";

-- Remove per-muscle pump fields
ALTER TABLE "MuscleGroupFeedback" DROP COLUMN "pump";
ALTER TABLE "MuscleGroupFeedback" DROP COLUMN "pumpScore";
