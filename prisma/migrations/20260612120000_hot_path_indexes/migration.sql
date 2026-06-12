-- CreateIndex
CREATE INDEX "Mesocycle_userId_status_createdAt_idx" ON "Mesocycle"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Workout_userId_status_createdAt_idx" ON "Workout"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Workout_userId_status_completedAt_idx" ON "Workout"("userId", "status", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "Workout_mesocycleId_status_completedAt_idx" ON "Workout"("mesocycleId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "Set_exerciseId_idx" ON "Set"("exerciseId");

-- CreateIndex
CREATE INDEX "PerformanceHistory_userId_date_idx" ON "PerformanceHistory"("userId", "date" DESC);

-- CreateIndex
CREATE INDEX "ProgressionLog_userId_exerciseId_status_loggedAt_idx" ON "ProgressionLog"("userId", "exerciseId", "status", "loggedAt" DESC);

-- CreateIndex
CREATE INDEX "BioFeedback_userId_loggedAt_idx" ON "BioFeedback"("userId", "loggedAt" DESC);

-- CreateIndex
CREATE INDEX "NotificationLog_userId_createdAt_idx" ON "NotificationLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FoodLog_userId_date_idx" ON "FoodLog"("userId", "date");

-- CreateIndex
CREATE INDEX "MuscleGroupFeedback_userId_muscleGroup_loggedAt_idx" ON "MuscleGroupFeedback"("userId", "muscleGroup", "loggedAt" DESC);
