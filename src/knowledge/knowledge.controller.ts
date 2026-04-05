import { Controller, Get, Param, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledge: KnowledgeService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('audience') audience?: string,
  ) {
    return this.knowledge.findAll({ category, tag, audience });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.knowledge.findBySlug(slug);
  }
}