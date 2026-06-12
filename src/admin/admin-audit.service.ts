import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AdminAuditAction = 'CREATED' | 'UPDATED' | 'DELETED';

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    actorId: string,
    entityType: string,
    entityId: string,
    action: AdminAuditAction,
    summary?: string,
  ) {
    return this.prisma.adminAuditLog.create({
      data: { actorId, entityType, entityId, action, summary },
    });
  }

  async recent(limit = 20) {
    return this.list({ limit });
  }

  async list(params: {
    limit?: number;
    offset?: number;
    actorId?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
  }) {
    const { limit = 25, offset = 0, actorId, entityType, from, to } = params;
    const where = {
      ...(actorId ? { actorId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    const actorIds = [...new Set(items.map((i) => i.actorId))];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, displayName: true, email: true },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    return {
      items: items.map((item) => ({
        ...item,
        actor: actorMap.get(item.actorId) ?? null,
      })),
      total,
    };
  }
}
