DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MuscleGroup') THEN
    CREATE TYPE "MuscleGroup" AS ENUM (
      'CHEST','BACK','LATS','FRONT_DELT','SIDE_DELT','REAR_DELT','QUADS','HAMSTRINGS','GLUTES','BICEPS','TRICEPS','CALVES','LOWER_BACK'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MovementPattern') THEN
    CREATE TYPE "MovementPattern" AS ENUM (
      'HORIZONTAL_PUSH','VERTICAL_PUSH','HORIZONTAL_PULL','VERTICAL_PULL','SQUAT','HINGE','ISOLATION'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExerciseType') THEN
    CREATE TYPE "ExerciseType" AS ENUM (
      'COMPOUND','ISOLATION'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MovementClass') THEN
    CREATE TYPE "MovementClass" AS ENUM (
      'BACK_STRAIGHT_ARM_PULL','BACK_VERTICAL_PULL','BACK_HORIZONTAL_PULL','BACK_AXIAL_HINGE','GLUTE_HIP_THRUST','GLUTE_HIP_HINGE','GLUTE_SQUAT','GLUTE_HIP_ABDUCTION','GLUTE_KICKBACK','CALF_STANDING','CALF_SEATED','CALF_UNILATERAL','CALF_STRETCH_BIASED','CORE_SPINAL_FLEXION','CORE_ANTI_EXTENSION','CORE_ANTI_ROTATION','CORE_ROTATION','CORE_HIP_FLEXION','CORE_LOADED_CARRY'
    );
  END IF;
END $$;

ALTER TABLE "Exercise"
  ALTER COLUMN "primaryMuscle" TYPE "MuscleGroup"
  USING ("primaryMuscle"::text::"MuscleGroup"),
  ALTER COLUMN "secondaryMuscles" TYPE "MuscleGroup"[]
  USING ("secondaryMuscles"::text[]::"MuscleGroup"[]),
  ALTER COLUMN "movementPattern" TYPE "MovementPattern"
  USING ("movementPattern"::text::"MovementPattern"),
  ALTER COLUMN "exerciseType" TYPE "ExerciseType"
  USING ("exerciseType"::text::"ExerciseType");

ALTER TABLE "Exercise"
  ADD COLUMN "movementClass" "MovementClass";
