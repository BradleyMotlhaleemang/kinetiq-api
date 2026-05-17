-- AlterTable
ALTER TABLE "ProgressionLog" ADD COLUMN     "workoutId" TEXT;

-- CreateIndex
CREATE INDEX "ProgressionLog_workoutId_idx" ON "ProgressionLog"("workoutId");
