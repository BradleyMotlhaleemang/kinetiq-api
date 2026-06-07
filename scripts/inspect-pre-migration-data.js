require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const wtCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='WorkoutTemplate' ORDER BY ordinal_position
  `);
  console.log('WorkoutTemplate columns:', wtCols.rows.map((r) => r.column_name).join(', '));

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM "WorkoutTemplate") AS workout_templates,
      (SELECT COUNT(*)::int FROM "MesocycleTemplate") AS mesocycle_templates,
      (SELECT COUNT(*)::int FROM "WorkoutTemplateDay") AS workout_template_days,
      (SELECT COUNT(*)::int FROM "SplitConfig") AS split_configs,
      (SELECT COUNT(*)::int FROM "SplitDay") AS split_days,
      (SELECT COUNT(*)::int FROM "Mesocycle") AS mesocycles,
      (SELECT COUNT(*)::int FROM "Workout") AS workouts
  `);
  console.log('Counts:', counts.rows[0]);

  const wt = await client.query(`SELECT * FROM "WorkoutTemplate" LIMIT 2`);
  console.log('Sample WorkoutTemplate:', JSON.stringify(wt.rows[0], null, 2));

  const wtd = await client.query(`
    SELECT wtd."mesocycleTemplateId", wtd."workoutTemplateId", wtd."dayNumber", mt.slug AS mt_slug, wt.slug AS wt_slug
    FROM "WorkoutTemplateDay" wtd
    JOIN "MesocycleTemplate" mt ON mt.id = wtd."mesocycleTemplateId"
    LEFT JOIN "WorkoutTemplate" wt ON wt.id = wtd."workoutTemplateId"
    LIMIT 5
  `);
  console.log('Sample WorkoutTemplateDay links:', JSON.stringify(wtd.rows, null, 2));

  const sd = await client.query(`
    SELECT sd.id, sd."splitConfigId", sd."dayNumber", sd.label, sc."templateId", wt.slug
    FROM "SplitDay" sd
    JOIN "SplitConfig" sc ON sc.id = sd."splitConfigId"
    JOIN "WorkoutTemplate" wt ON wt.id = sc."templateId"
    LIMIT 5
  `);
  console.log('Sample SplitDay chain:', JSON.stringify(sd.rows, null, 2));

  const sessionTypes = await client.query(`SELECT DISTINCT "sessionType" FROM "Workout"`);
  console.log('Workout sessionType values:', sessionTypes.rows);

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
