// src/templates/templates.controller.ts
import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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