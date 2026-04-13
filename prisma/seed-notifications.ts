import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'test@kinetiq.com' },
  })

  if (!user) {
    console.log('No test user found — run main seed first')
    return
  }

  const types = [
    'BIOFEEDBACK_PROMPT',
    'RECOVERY_WARNING',
    'WEEKLY_FEEDBACK_PROMPT',
    'WORKOUT_REMINDER',
    'WEIGHT_LOG_REMINDER',
  ]

  for (const type of types) {
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type,
        deliveryChannel: 'IN_APP',
        payload: {},
        isRead: false,
      },
    })
  }

  console.log(`Seeded ${types.length} notifications for ${user.email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())