require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const dupSets = await client.query(`
    SELECT "workoutId", "exerciseId", "setNumber", COUNT(*)::int AS n
    FROM "Set"
    GROUP BY 1,2,3 HAVING COUNT(*) > 1
    LIMIT 5
  `);
  console.log('Duplicate Set keys:', dupSets.rows);

  const mtUnmapped = await client.query(`
    SELECT mt.id, mt.slug, mt."daysPerWeek", mt."splitStyle"::text AS split_style,
      (
        SELECT wt.id FROM "WorkoutTemplate" wt
        WHERE wt."daysPerWeek" = mt."daysPerWeek"
          AND wt."splitType" = CASE mt."splitStyle"::text
            WHEN 'PPL' THEN 'PPL'
            WHEN 'UPPER_LOWER' THEN 'UPPER_LOWER'
            WHEN 'FULL_BODY' THEN 'FULL_BODY'
            WHEN 'BODY_PART' THEN 'BODY_PART'
            WHEN 'HYBRID' THEN 'HYBRID'
            WHEN 'SPECIALIZED' THEN 'PPL'
            WHEN 'SPECIALIZATION' THEN 'BODY_PART'
            WHEN 'LOWER_BIAS' THEN 'UPPER_LOWER'
            ELSE 'FULL_BODY'
          END
        ORDER BY wt."createdAt"
        LIMIT 1
      ) AS matched_split_id
    FROM "MesocycleTemplate" mt
  `);
  const missing = mtUnmapped.rows.filter((r) => !r.matched_split_id);
  console.log('MesocycleTemplates without split match:', missing.length, missing.slice(0, 3));

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
