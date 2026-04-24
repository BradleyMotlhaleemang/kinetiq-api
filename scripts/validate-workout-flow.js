require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const latest = await prisma.mesocycle.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, startDate: true },
  });

  if (!latest) {
    console.log('NO_MESOCYCLE');
    return;
  }

  console.log('LATEST_MESOCYCLE', latest);

  const q1 = await prisma.$queryRawUnsafe(
    'SELECT "weekNumber", "dayNumber", "scheduledDate", "sessionType" FROM "Workout" WHERE "mesocycleId" = $1 ORDER BY "weekNumber", "dayNumber" LIMIT 20',
    latest.id,
  );
  console.log('Q1_ROWS', q1.length);
  console.log(JSON.stringify(q1, null, 2));

  const q2 = await prisma.$queryRawUnsafe(
    'SELECT "sessionType", "prescriptionSnapshot" IS NOT NULL AS has_prescription FROM "Workout" WHERE "mesocycleId" = $1 AND "weekNumber" = 1 ORDER BY "dayNumber"',
    latest.id,
  );
  console.log('Q2_ROWS', q2.length);
  console.log(JSON.stringify(q2, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
