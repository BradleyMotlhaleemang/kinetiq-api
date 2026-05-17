require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query("delete from _prisma_migrations where migration_name = '20260516065500_exercise_enum_fields_and_movement_class' and rolled_back_at is not null");
  await c.end();
  console.log('Deleted rolled-back migration metadata rows.');
})();
