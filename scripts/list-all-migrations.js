require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const rows = await client.query(`
    SELECT migration_name, finished_at IS NOT NULL AS finished,
           finished_at IS NULL AND rolled_back_at IS NULL AS failed,
           rolled_back_at IS NOT NULL AS rolled_back
    FROM "_prisma_migrations"
    ORDER BY started_at
  `);

  console.log('All migrations in _prisma_migrations:\n');
  for (const r of rows.rows) {
    let status = r.finished ? 'APPLIED' : r.rolled_back ? 'ROLLED_BACK' : 'FAILED/PENDING';
    console.log(`  ${status.padEnd(14)} ${r.migration_name}`);
  }

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
