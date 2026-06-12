import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateLimitsService } from '../common/template-limits.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateLimitsService, PrismaService],
  exports: [TemplatesService],
})
export class TemplatesModule {}