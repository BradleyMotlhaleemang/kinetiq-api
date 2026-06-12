-- CreateEnum
CREATE TYPE "ChestRegion" AS ENUM ('UPPER', 'MID', 'LOWER', 'OVERALL');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "chestRegion" "ChestRegion";
ALTER TABLE "Exercise" ADD COLUMN "inclineAngleDegrees" INTEGER;
