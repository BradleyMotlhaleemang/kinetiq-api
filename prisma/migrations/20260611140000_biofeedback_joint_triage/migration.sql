-- CreateEnum
CREATE TYPE "JointTriageOutcome" AS ENUM ('HEALTHY', 'MILD', 'SIGNIFICANT', 'SKIPPED');

-- AlterTable
ALTER TABLE "BioFeedback" ADD COLUMN "jointTriage" "JointTriageOutcome";
