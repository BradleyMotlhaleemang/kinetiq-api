// src/templates/templates.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { TemplatesService } from './templates.service';
import { TemplatesQueryDto } from './dto/templates-query.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  /**
   * GET /templates
   * Returns the catalogue list. All fields are card-ready.
   * Query params: goal, level, splitStyle, daysPerWeekMin, daysPerWeekMax,
   *               featuredOnly, search
   */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get()
  findAll(@Query() query: TemplatesQueryDto) {
    return this.svc.findAll(query);
  }

  /**
   * GET /templates/recommendation
   * Returns a matched template + alternatives for mesocycle wizard step 1.
   * Query params: level (ExperienceLevel), goal (TrainingGoal), daysAvailable (int)
   */
  @Get('recommendation')
  recommend(
    @Query('level') level: string,
    @Query('goal') goal: string,
    @Query('daysAvailable') daysAvailable: string,
  ) {
    return this.svc.recommend(
      (goal ?? 'MUSCLE_GAIN').toUpperCase(),
      (level ?? 'INTERMEDIATE').toUpperCase(),
      parseInt(daysAvailable ?? '4', 10),
    );
  }

  /**
   * GET /templates/recommended
   * Authenticated recommendation using current user profile.
   */
  @Get('recommended')
  recommended(@Request() req: any, @Query('daysAvailable') daysAvailable: string) {
    return this.svc.recommendForUser(
      req.user.userId,
      parseInt(daysAvailable ?? '4', 10),
    );
  }

  @Get('mine')
  findMine(@Request() req: { user: { userId: string } }) {
    return this.svc.findUserTemplates(req.user.userId);
  }

  /**
   * POST /templates/:id/fork
   * Deep-clones a system template into a user-owned SplitTemplate.
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('scratch')
  createScratch(
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      name?: string;
      daysPerWeek?: number;
      days?: Array<{ dayNumber: number; dayType: 'WORKOUT' | 'REST'; label: string }>;
    },
  ) {
    return this.svc.createScratch(req.user.userId, body);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post(':id/fork')
  fork(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.svc.forkTemplate(req.user.userId, id);
  }

  @Patch(':id')
  updateMetadata(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      daysPerWeek?: number;
      splitType?: string;
      level?: string;
      goal?: string;
    },
  ) {
    return this.svc.updateMetadata(req.user.userId, id, body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch(':id/days')
  replaceDays(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { days: Array<Record<string, unknown>> },
  ) {
    return this.svc.replaceDays(req.user.userId, id, body.days as any);
  }

  @Post(':id/validate')
  validate(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.svc.validateTemplate(req.user.userId, id);
  }

  @Delete(':id')
  remove(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.svc.deleteUserTemplate(req.user.userId, id);
  }

  /**
   * GET /templates/:id
   * Returns full detail payload (modal-ready + program summary).
   * :id can be UUID or slug (e.g. MC-017)
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}