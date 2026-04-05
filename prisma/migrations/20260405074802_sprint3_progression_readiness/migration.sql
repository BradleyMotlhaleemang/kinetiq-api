-- CreateTable
CREATE TABLE "SessionReadiness" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT,
    "sleepScore" INTEGER NOT NULL,
    "stressScore" INTEGER NOT NULL,
    "nutritionScore" INTEGER NOT NULL,
    "motivationScore" INTEGER NOT NULL,
    "muscleReadinessScore" INTEGER NOT NULL,
    "sessionReadiness" DOUBLE PRECISION NOT NULL,
    "sessionMode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mesocycleId" TEXT,
    "weekNumber" INTEGER NOT NULL,
    "motivationScore" INTEGER NOT NULL,
    "fatiguePerception" INTEGER NOT NULL,
    "performanceFeeling" INTEGER NOT NULL,
    "energyLevelAvg" DOUBLE PRECISION,
    "sleepQualityAvg" DOUBLE PRECISION,
    "stressLevelAvg" DOUBLE PRECISION,
    "jointPainMap" JSONB,
    "notes" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "relatedSlugs" JSONB,
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "tags" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "bestE1rm" DOUBLE PRECISION NOT NULL,
    "bestWeight" DOUBLE PRECISION NOT NULL,
    "bestReps" INTEGER NOT NULL,
    "totalVolume" DOUBLE PRECISION NOT NULL,
    "totalSets" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "weightTarget" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "contextSnapshot" JSONB,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PRRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "prType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutId" TEXT NOT NULL,

    CONSTRAINT "PRRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlateauMarker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlateauMarker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionReadiness_workoutId_key" ON "SessionReadiness"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyFeedback_userId_mesocycleId_weekNumber_key" ON "WeeklyFeedback"("userId", "mesocycleId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEntry_slug_key" ON "KnowledgeEntry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceHistory_userId_exerciseId_date_key" ON "PerformanceHistory"("userId", "exerciseId", "date");

-- AddForeignKey
ALTER TABLE "SessionReadiness" ADD CONSTRAINT "SessionReadiness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReadiness" ADD CONSTRAINT "SessionReadiness_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyFeedback" ADD CONSTRAINT "WeeklyFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyFeedback" ADD CONSTRAINT "WeeklyFeedback_mesocycleId_fkey" FOREIGN KEY ("mesocycleId") REFERENCES "Mesocycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceHistory" ADD CONSTRAINT "PerformanceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceHistory" ADD CONSTRAINT "PerformanceHistory_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceHistory" ADD CONSTRAINT "PerformanceHistory_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionLog" ADD CONSTRAINT "ProgressionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionLog" ADD CONSTRAINT "ProgressionLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRRecord" ADD CONSTRAINT "PRRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRRecord" ADD CONSTRAINT "PRRecord_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRRecord" ADD CONSTRAINT "PRRecord_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateauMarker" ADD CONSTRAINT "PlateauMarker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateauMarker" ADD CONSTRAINT "PlateauMarker_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
