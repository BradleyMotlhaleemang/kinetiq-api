-- CreateEnum
CREATE TYPE "ProgressionLogStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "ProgressionLog" ADD COLUMN     "actualReps" INTEGER,
ADD COLUMN     "actualSets" INTEGER,
ADD COLUMN     "actualWeight" DOUBLE PRECISION,
ADD COLUMN     "completionRate" DOUBLE PRECISION,
ADD COLUMN     "confidenceLevel" TEXT,
ADD COLUMN     "enginePhase" TEXT,
ADD COLUMN     "physiologicalState" TEXT,
ADD COLUMN     "prescribedReps" INTEGER,
ADD COLUMN     "prescribedSets" INTEGER,
ADD COLUMN     "prescribedWeight" DOUBLE PRECISION,
ADD COLUMN     "repCompletionRate" DOUBLE PRECISION,
ADD COLUMN     "status" "ProgressionLogStatus" NOT NULL DEFAULT 'PENDING';
