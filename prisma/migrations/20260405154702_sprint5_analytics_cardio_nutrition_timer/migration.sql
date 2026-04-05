-- CreateTable
CREATE TABLE "FatigueSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sfl24h" DOUBLE PRECISION NOT NULL,
    "sfl48h" DOUBLE PRECISION NOT NULL,
    "sfl72h" DOUBLE PRECISION NOT NULL,
    "sfl7d" DOUBLE PRECISION NOT NULL,
    "cnsLoadScore" DOUBLE PRECISION NOT NULL,
    "metabolicLoadScore" DOUBLE PRECISION NOT NULL,
    "muscleFatigueMap" JSONB NOT NULL,
    "jointStressMap" JSONB NOT NULL,

    CONSTRAINT "FatigueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardioSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "avgHeartRate" INTEGER,
    "peakHeartRate" INTEGER,
    "caloriesEstimated" DOUBLE PRECISION,
    "cardioZone" TEXT NOT NULL,
    "perceivedEffort" INTEGER NOT NULL,
    "sflContribution" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardioSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caloriesPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL,
    "carbsPer100g" DOUBLE PRECISION NOT NULL,
    "fatPer100g" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "quantityGrams" DOUBLE PRECISION NOT NULL,
    "caloriesConsumed" DOUBLE PRECISION NOT NULL,
    "proteinConsumed" DOUBLE PRECISION NOT NULL,
    "carbsConsumed" DOUBLE PRECISION NOT NULL,
    "fatsConsumed" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caloriesTarget" DOUBLE PRECISION NOT NULL,
    "proteinTarget" DOUBLE PRECISION NOT NULL,
    "carbsTarget" DOUBLE PRECISION NOT NULL,
    "fatsTarget" DOUBLE PRECISION NOT NULL,
    "calculatedFromWeightKg" DOUBLE PRECISION NOT NULL,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplementLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "supplementName" TEXT NOT NULL,
    "doseMg" DOUBLE PRECISION NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplementLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserExerciseSFR" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sfrScore" DOUBLE PRECISION NOT NULL,
    "stimulusAvg" DOUBLE PRECISION NOT NULL,
    "fatigueAvg" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserExerciseSFR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "sessionType" TEXT,
    "restSeconds" INTEGER NOT NULL,

    CONSTRAINT "RestPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetRestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "previousSetId" TEXT,
    "actualRestSeconds" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetRestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_name_key" ON "FoodItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTarget_userId_key" ON "NutritionTarget"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserExerciseSFR_userId_exerciseId_key" ON "UserExerciseSFR"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "RestPreference_userId_exerciseId_key" ON "RestPreference"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "FatigueSnapshot" ADD CONSTRAINT "FatigueSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardioSession" ADD CONSTRAINT "CardioSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementLog" ADD CONSTRAINT "SupplementLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementLog" ADD CONSTRAINT "SupplementLog_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExerciseSFR" ADD CONSTRAINT "UserExerciseSFR_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExerciseSFR" ADD CONSTRAINT "UserExerciseSFR_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestPreference" ADD CONSTRAINT "RestPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetRestLog" ADD CONSTRAINT "SetRestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetRestLog" ADD CONSTRAINT "SetRestLog_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
