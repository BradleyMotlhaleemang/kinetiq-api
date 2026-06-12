-- AlterTable
ALTER TABLE "User" ADD COLUMN "classificationAnswers" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "User" ADD COLUMN "daysPerWeek" INTEGER;
