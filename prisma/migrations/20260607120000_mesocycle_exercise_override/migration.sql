-- CreateTable
CREATE TABLE "MesocycleExerciseOverride" (
    "id" TEXT NOT NULL,
    "mesocycleId" TEXT NOT NULL,
    "splitDayExerciseId" TEXT NOT NULL,
    "originalExerciseId" TEXT NOT NULL,
    "substituteExerciseId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MesocycleExerciseOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MesocycleExerciseOverride_mesocycleId_splitDayExerciseId_key" ON "MesocycleExerciseOverride"("mesocycleId", "splitDayExerciseId");

-- CreateIndex
CREATE INDEX "MesocycleExerciseOverride_mesocycleId_idx" ON "MesocycleExerciseOverride"("mesocycleId");

-- AddForeignKey
ALTER TABLE "MesocycleExerciseOverride" ADD CONSTRAINT "MesocycleExerciseOverride_mesocycleId_fkey" FOREIGN KEY ("mesocycleId") REFERENCES "Mesocycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
