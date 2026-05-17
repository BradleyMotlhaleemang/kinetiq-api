require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("select column_name from information_schema.columns where table_name = '_prisma_migrations' order by ordinal_position");
  console.log(r.rows.map(x=>x.column_name).join('\n'));
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
