-- AlterTable
ALTER TABLE "SplitDayExercise" ADD COLUMN "rpeTarget" DOUBLE PRECISION;

-- Backfill from rep range midpoint heuristic
UPDATE "SplitDayExercise"
SET "rpeTarget" = CASE
  WHEN (("repRangeMin" + "repRangeMax")::float / 2.0) <= 6 THEN 8.5
  WHEN (("repRangeMin" + "repRangeMax")::float / 2.0) <= 9 THEN 8.0
  WHEN (("repRangeMin" + "repRangeMax")::float / 2.0) <= 12 THEN 7.5
  ELSE 7.0
END
WHERE "rpeTarget" IS NULL;

ALTER TABLE "SplitDayExercise" ALTER COLUMN "rpeTarget" SET NOT NULL;
