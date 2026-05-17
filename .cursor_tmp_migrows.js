require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("select migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count from _prisma_migrations where migration_name='20260516065500_exercise_enum_fields_and_movement_class' order by started_at");
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
})();
