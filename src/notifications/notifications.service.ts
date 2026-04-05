import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PRIORITY_ORDER = [
  'RECOVERY_WARNING',
  'PAIN_REVIEW_PROMPT',
  'WORKOUT_REMINDER',
  'BIOFEEDBACK_PROMPT',
  'WEEKLY_FEEDBACK_PROMPT',
  'MEAL_REMINDER',
  'WEIGHT_LOG_REMINDER',
];

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: string,
    payload?: Record<string, any>,
    deliveryChannel = 'IN_APP',
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingToday = await this.prisma.notificationLog.findFirst({
      where: {
        userId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingToday) {
      const existingPriority = PRIORITY_ORDER.indexOf(existingToday.type);
      const newPriority = PRIORITY_ORDER.indexOf(type);

      if (newPriority >= existingPriority) {
        return null;
      }
    }

    return this.prisma.notificationLog.create({
      data: {
        userId,
        type,
        deliveryChannel,
        payload: payload ? (payload as any) : undefined,
        isRead: false,
      },
    });
  }

  async getFeed(userId: string) {
    return this.prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notificationLog.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notificationLog.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }
}