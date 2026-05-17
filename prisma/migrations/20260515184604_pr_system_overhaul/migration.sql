/*
  Warnings:

  - You are about to drop the column `prType` on the `PRRecord` table. All the data in the column will be lost.
  - Added the required column `e1rm` to the `PRRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reps` to the `PRRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scope` to the `PRRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `PRRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `PRRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PRScope" AS ENUM ('ALL_TIME', 'MESOCYCLE', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PRType" AS ENUM ('E1RM', 'WEIGHT', 'VOLUME');

-- AlterTable
ALTER TABLE "PRRecord" DROP COLUMN "prType",
ADD COLUMN     "e1rm" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "equipmentName" TEXT,
ADD COLUMN     "mesocycleId" TEXT,
ADD COLUMN     "monthYear" TEXT,
ADD COLUMN     "reps" INTEGER NOT NULL,
ADD COLUMN     "scope" "PRScope" NOT NULL,
ADD COLUMN     "setId" TEXT,
ADD COLUMN     "type" "PRType" NOT NULL,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "PRRecord_userId_exerciseId_scope_type_idx" ON "PRRecord"("userId", "exerciseId", "scope", "type");

-- CreateIndex
CREATE INDEX "PRRecord_userId_achievedAt_idx" ON "PRRecord"("userId", "achievedAt");
