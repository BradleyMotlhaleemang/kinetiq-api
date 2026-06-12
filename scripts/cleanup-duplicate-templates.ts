/**
 * One-time cleanup for accidental admin template duplicates.
 * Targets unpublished MesocycleTemplate rows created via duplicate (slug contains "-copy-").
 *
 * Usage (dry run):
 *   npx ts-node scripts/cleanup-duplicate-templates.ts
 *
 * Apply deletions:
 *   npx ts-node scripts/cleanup-duplicate-templates.ts --apply
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const apply = process.argv.includes('--apply');

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const duplicates = await prisma.mesocycleTemplate.findMany({
      where: {
        isPublished: false,
        featured: false,
        slug: { contains: '-copy-' },
        name: { contains: '(Copy)' },
      },
      select: { id: true, name: true, slug: true, splitTemplateId: true },
      orderBy: { createdAt: 'desc' },
    });

    const orphanSplits = await prisma.splitTemplate.findMany({
      where: {
        isSystem: true,
        slug: { contains: '-copy-' },
        name: { contains: '(Copy)' },
        mesocycleTemplates: { none: {} },
      },
      select: { id: true, name: true, slug: true },
    });

    const splitIds = [
      ...new Set([
        ...duplicates.map((p) => p.splitTemplateId),
        ...orphanSplits.map((s) => s.id),
      ]),
    ];

    console.log(`Found ${duplicates.length} duplicate program template(s).`);
    console.log(`Found ${orphanSplits.length} orphaned split template(s).`);

    for (const program of duplicates) {
      console.log(`  program: ${program.name} (${program.id})`);
    }
    for (const split of orphanSplits) {
      console.log(`  orphan split: ${split.name} (${split.id})`);
    }

    if (splitIds.length === 0) {
      console.log('Nothing to clean up.');
      return;
    }

    if (!apply) {
      console.log('\nDry run only. Re-run with --apply to delete.');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const programIds = duplicates.map((p) => p.id);

      if (programIds.length > 0) {
        await tx.mesocycleTemplate.deleteMany({ where: { id: { in: programIds } } });
      }

      const dayIds = (
        await tx.splitDay.findMany({
          where: { splitTemplateId: { in: splitIds } },
          select: { id: true },
        })
      ).map((d) => d.id);

      if (dayIds.length > 0) {
        await tx.splitDayExercise.deleteMany({ where: { splitDayId: { in: dayIds } } });
        await tx.splitDay.deleteMany({ where: { id: { in: dayIds } } });
      }

      const deletableSplits = await tx.splitTemplate.findMany({
        where: {
          id: { in: splitIds },
          mesocycles: { none: {} },
          workouts: { none: {} },
        },
        select: { id: true },
      });

      if (deletableSplits.length > 0) {
        await tx.splitTemplate.deleteMany({
          where: { id: { in: deletableSplits.map((s) => s.id) } },
        });
      }

      console.log(`Deleted ${programIds.length} program template(s).`);
      console.log(`Deleted ${deletableSplits.length} split template(s).`);
    });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
