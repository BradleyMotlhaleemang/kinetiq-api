-- Migration row state
SELECT migration_name, started_at, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
WHERE migration_name LIKE '%20260528111500%'
ORDER BY started_at DESC;

-- Schema indicators for 20260528111500_restructure_split_template_hierarchy
SELECT 'SplitTemplate' AS check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SplitTemplate') AS present;

SELECT 'SplitConfig_dropped' AS check_name,
  NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SplitConfig') AS present;

SELECT 'WorkoutTemplate_dropped' AS check_name,
  NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'WorkoutTemplate') AS present;

SELECT 'Mesocycle.splitTemplateId' AS check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Mesocycle' AND column_name = 'splitTemplateId'
  ) AS present;

SELECT 'DayType_enum' AS check_name,
  EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DayType') AS present;

SELECT 'SessionType_enum' AS check_name,
  EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionType') AS present;

SELECT 'WorkoutExercise' AS check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'WorkoutExercise') AS present;
