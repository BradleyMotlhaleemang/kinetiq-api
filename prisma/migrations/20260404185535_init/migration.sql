-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "trainingAgeMths" INTEGER NOT NULL DEFAULT 0,
    "bodyweightKg" DOUBLE PRECISION,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryMuscle" TEXT NOT NULL,
    "secondaryMuscles" TEXT[],
    "movementPattern" TEXT NOT NULL,
    "exerciseType" TEXT NOT NULL,
    "isCompound" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseMetadata" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "fatigueScore" DOUBLE PRECISION NOT NULL,
    "stabilityDemand" DOUBLE PRECISION NOT NULL,
    "methodFatigueMultiplier" DOUBLE PRECISION NOT NULL,
    "equipmentProfileId" TEXT NOT NULL,
    "executionProfileId" TEXT NOT NULL,

    CONSTRAINT "ExerciseMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredEquipment" TEXT[],

    CONSTRAINT "EquipmentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionProfile" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rpeRange" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ExecutionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstitutionPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryMuscle" TEXT NOT NULL,
    "movementPattern" TEXT NOT NULL,

    CONSTRAINT "SubstitutionPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstitutionPoolExercise" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "suitableWhenPain" TEXT[],

    CONSTRAINT "SubstitutionPoolExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "splitType" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,

    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitConfig" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "splitLabel" TEXT NOT NULL,

    CONSTRAINT "SplitConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitDay" (
    "id" TEXT NOT NULL,
    "splitConfigId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SplitDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitDayExercise" (
    "id" TEXT NOT NULL,
    "splitDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "setsTarget" INTEGER NOT NULL,
    "repRangeMin" INTEGER NOT NULL,
    "repRangeMax" INTEGER NOT NULL,

    CONSTRAINT "SplitDayExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseMetadata_exerciseId_key" ON "ExerciseMetadata"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentProfile_name_key" ON "EquipmentProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionProfile_zone_key" ON "ExecutionProfile"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "SubstitutionPool_name_key" ON "SubstitutionPool"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubstitutionPoolExercise_poolId_exerciseId_key" ON "SubstitutionPoolExercise"("poolId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutTemplate_name_key" ON "WorkoutTemplate"("name");

-- AddForeignKey
ALTER TABLE "ExerciseMetadata" ADD CONSTRAINT "ExerciseMetadata_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMetadata" ADD CONSTRAINT "ExerciseMetadata_equipmentProfileId_fkey" FOREIGN KEY ("equipmentProfileId") REFERENCES "EquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMetadata" ADD CONSTRAINT "ExerciseMetadata_executionProfileId_fkey" FOREIGN KEY ("executionProfileId") REFERENCES "ExecutionProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstitutionPoolExercise" ADD CONSTRAINT "SubstitutionPoolExercise_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "SubstitutionPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstitutionPoolExercise" ADD CONSTRAINT "SubstitutionPoolExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitConfig" ADD CONSTRAINT "SplitConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDay" ADD CONSTRAINT "SplitDay_splitConfigId_fkey" FOREIGN KEY ("splitConfigId") REFERENCES "SplitConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDayExercise" ADD CONSTRAINT "SplitDayExercise_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "SplitDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
