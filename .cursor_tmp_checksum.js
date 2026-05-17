require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

(async () => {
  const file = fs.readFileSync('prisma/migrations/20260516065500_exercise_enum_fields_and_movement_class/migration.sql','utf8');
  const hash = crypto.createHash('sha256').update(file).digest('hex');
  console.log('file_sha256', hash);

  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("select migration_name, checksum from _prisma_migrations where migration_name='20260516065500_exercise_enum_fields_and_movement_class' order by started_at desc");
  console.log(r.rows);
  await c.end();
})();
