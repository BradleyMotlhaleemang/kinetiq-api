import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const entry = await this.prisma.knowledgeEntry.findUnique({
      where: { slug },
    });
    if (!entry) throw new NotFoundException(`Knowledge entry '${slug}' not found`);
    return entry;
  }

  async findAll(filters?: {
    category?: string;
    tag?: string;
    audience?: string;
  }) {
    return this.prisma.knowledgeEntry.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.audience && { targetAudience: filters.audience }),
      },
      select: {
        slug: true,
        category: true,
        title: true,
        summary: true,
        targetAudience: true,
        tags: true,
      },
      orderBy: { category: 'asc' },
    });
  }
}