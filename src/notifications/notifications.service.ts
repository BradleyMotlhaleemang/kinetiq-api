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

  async getFeed(
    userId: string,
    options?: { isRead?: boolean; pageSize?: number; pageNumber?: number },
  ) {
    const pageSize = options?.pageSize ?? 20;
    const pageNumber = options?.pageNumber ?? 1;

    const where = {
      userId,
      ...(options?.isRead !== undefined && { isRead: options.isRead }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        pageNumber,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
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

  async markAllRead(userId: string) {
    const result = await this.prisma.notificationLog.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  getRedirectRoute(type: string): string {
    const routes: Record<string, string> = {
      BIOFEEDBACK_PROMPT: '/biofeedback',
      RECOVERY_WARNING: '/dashboard',
      PAIN_REVIEW_PROMPT: '/substitutions',
      WORKOUT_REMINDER: '/dashboard',
      WEEKLY_FEEDBACK_PROMPT: '/weekly-feedback',
      MEAL_REMINDER: '/nutrition',
      WEIGHT_LOG_REMINDER: '/profile',
    };
    return routes[type] ?? '/dashboard';
  }
}