require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const migration = await client.query(`
    SELECT migration_name, started_at, finished_at, rolled_back_at, logs
    FROM "_prisma_migrations"
    WHERE migration_name LIKE '%20260528111500%'
    ORDER BY started_at DESC
  `);

  console.log('=== MIGRATION ROW ===');
  if (migration.rows.length === 0) {
    console.log('State: ROW MISSING ENTIRELY');
  } else {
    for (const row of migration.rows) {
      console.log(JSON.stringify(row, null, 2));
      if (row.rolled_back_at) {
        console.log('State: ROW PRESENT, rolled_back_at SET');
      } else if (!row.finished_at) {
        console.log('State: ROW PRESENT, finished_at IS NULL (failed/incomplete)');
      } else {
        console.log('State: ROW PRESENT, successfully finished');
      }
    }
  }

  const checks = [
    ['SplitTemplate table', `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='SplitTemplate') AS ok`],
    ['SplitConfig dropped', `SELECT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='SplitConfig') AS ok`],
    ['WorkoutTemplate dropped', `SELECT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='WorkoutTemplate') AS ok`],
    ['Mesocycle.splitTemplateId', `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Mesocycle' AND column_name='splitTemplateId') AS ok`],
    ['DayType enum', `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname='DayType') AS ok`],
    ['SessionType enum', `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname='SessionType') AS ok`],
    ['WorkoutExercise table', `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='WorkoutExercise') AS ok`],
  ];

  console.log('\n=== SCHEMA CHECKS ===');
  let allApplied = true;
  for (const [label, sql] of checks) {
    const result = await client.query(sql);
    const ok = result.rows[0].ok;
    console.log(`${label}: ${ok ? 'YES' : 'NO'}`);
    if (!ok) allApplied = false;
  }

  console.log('\n=== VERDICT ===');
  console.log(allApplied ? 'Schema changes appear APPLIED' : 'Schema changes NOT fully applied');

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
