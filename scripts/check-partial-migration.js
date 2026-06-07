require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'SplitTemplate','SplitConfig','WorkoutTemplate','WorkoutTemplateDay',
        'TemplateSlot','WorkoutExercise','Mesocycle','MesocycleTemplate','SplitDay','Workout'
      )
    ORDER BY table_name
  `);
  console.log('Tables present:', tables.rows.map((r) => r.table_name).join(', '));

  const mesoCols = await client.query(`
    SELECT column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Mesocycle'
    ORDER BY ordinal_position
  `);
  console.log('\nMesocycle columns:');
  for (const c of mesoCols.rows) console.log(`  ${c.column_name} (${c.data_type}, nullable=${c.is_nullable})`);

  const mesoCount = await client.query('SELECT COUNT(*)::int AS n FROM "Mesocycle"');
  console.log('\nMesocycle row count:', mesoCount.rows[0].n);

  const workoutSession = await client.query(`
    SELECT column_name, udt_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Workout' AND column_name='sessionType'
  `);
  console.log('\nWorkout.sessionType:', workoutSession.rows[0] || 'missing');

  const enums = await client.query(`SELECT typname FROM pg_type WHERE typname IN ('DayType','SessionType') ORDER BY typname`);
  console.log('\nEnums:', enums.rows.map((r) => r.typname).join(', '));

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
