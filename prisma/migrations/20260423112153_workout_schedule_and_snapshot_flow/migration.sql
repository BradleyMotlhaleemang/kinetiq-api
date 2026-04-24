-- AlterTable
ALTER TABLE "Mesocycle" ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "dayNumber" INTEGER,
ADD COLUMN     "sessionType" TEXT,
ADD COLUMN     "weekNumber" INTEGER;
