-- CreateTable
CREATE TABLE "MuscleGroupFeedback" (
    "id" TEXT NOT NULL,
    "bioFeedbackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "jointPain" TEXT NOT NULL,
    "jointPainScore" INTEGER NOT NULL,
    "soreness" TEXT NOT NULL,
    "sorenessScore" DOUBLE PRECISION NOT NULL,
    "pump" TEXT NOT NULL,
    "pumpScore" DOUBLE PRECISION NOT NULL,
    "volume" TEXT NOT NULL,
    "volumeSignal" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuscleGroupFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuscleGroupFeedback_bioFeedbackId_muscleGroup_key" ON "MuscleGroupFeedback"("bioFeedbackId", "muscleGroup");

-- AddForeignKey
ALTER TABLE "MuscleGroupFeedback" ADD CONSTRAINT "MuscleGroupFeedback_bioFeedbackId_fkey" FOREIGN KEY ("bioFeedbackId") REFERENCES "BioFeedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuscleGroupFeedback" ADD CONSTRAINT "MuscleGroupFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
