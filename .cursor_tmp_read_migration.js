require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("select migration_name, script from _prisma_migrations where migration_name = '20260516065500_exercise_enum_fields_and_movement_class' order by finished_at desc limit 1");
  console.log(r.rows[0]?.script || 'NO_SCRIPT');
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
