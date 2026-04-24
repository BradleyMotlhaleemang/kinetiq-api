// src/templates/templates.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExperienceLevel, TrainingGoal } from '@prisma/client';
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
    @Query('goal')  goal:  string,
    @Query('daysAvailable') daysAvailable: string,
  ) {
    return this.svc.recommend(
      (ExperienceLevel[level?.toUpperCase() as keyof typeof ExperienceLevel] ?? ExperienceLevel.INTERMEDIATE),
      (TrainingGoal[goal?.toUpperCase() as keyof typeof TrainingGoal] ?? TrainingGoal.HYPERTROPHY),
      parseInt(daysAvailable ?? '4', 10),
    );
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