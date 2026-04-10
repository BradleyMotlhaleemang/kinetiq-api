import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.notificationLog.createMany({
    data: [
      {
        userId: 'cmnpxi29e0000p0d3bhajoofh',
        type: 'BIOFEEDBACK_PROMPT',
        deliveryChannel: 'IN_APP',
        payload: {},
        isRead: false,
      },
      {
        userId: 'cmnpxi29e0000p0d3bhajoofh',
        type: 'WORKOUT_REMINDER',
        deliveryChannel: 'IN_APP',
        payload: {},
        isRead: false,
      },
      {
        userId: 'cmnpxi29e0000p0d3bhajoofh',
        type: 'RECOVERY_WARNING',
        deliveryChannel: 'IN_APP',
        payload: {},
        isRead: true,
      },
    ],
  });
  console.log('Seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());