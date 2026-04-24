/*
  Warnings:

  - The `status` column on the `Workout` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "prescriptionSnapshot" JSONB,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "WorkoutStatus" NOT NULL DEFAULT 'PLANNED';
