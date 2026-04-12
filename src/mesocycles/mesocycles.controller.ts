import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MesocyclesService } from './mesocycles.service';
import {
  EXPERIENCE_LEVEL_LABELS,
  GOAL_MODE_LABELS,
  transformMesocycle,
  transformWorkoutTemplate,
} from '../common/transforms';

@UseGuards(AuthGuard('jwt'))
@Controller('mesocycles')
export class MesocyclesController {
  constructor(private mesocycles: MesocyclesService) {}

  @Get('recommend')
  async recommend(@Request() req: any) {
    const result = await this.mesocycles.recommendTemplate(req.user.userId);

    return {
      recommended: transformWorkoutTemplate(result.recommended),
      alternatives: result.alternatives.map(transformWorkoutTemplate),
      rationale: result.rationale,
      profile: {
        goalModeLabel: result.profile.goalMode
          ? GOAL_MODE_LABELS[result.profile.goalMode] ?? result.profile.goalMode
          : null,
        experienceLevelLabel: result.profile.experienceLevel
          ? EXPERIENCE_LEVEL_LABELS[result.profile.experienceLevel] ??
            result.profile.experienceLevel
          : null,
      },
    };
  }

  @Post('generate')
  async generate(
    @Request() req: any,
    @Body() body: { name: string; totalWeeks: number; templateId?: string },
  ) {
    const result = await this.mesocycles.generate(req.user.userId, body.name, body.totalWeeks, body.templateId);
    return transformMesocycle(result);
  }

  @Get('active')
  async findActive(@Request() req: any) {
    const result = await this.mesocycles.findActive(req.user.userId);
    return transformMesocycle(result);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const result = await this.mesocycles.findOne(req.user.userId, id);
    return transformMesocycle(result);
  }

  @Patch(':id/close')
  async close(@Request() req: any, @Param('id') id: string) {
    const result = await this.mesocycles.close(req.user.userId, id);
    return transformMesocycle(result);
  }

  @Get(':id/volume-status')
  volumeStatus(@Request() req: any, @Param('id') id: string) {
    return this.mesocycles.getVolumeStatus(req.user.userId, id);
  }
}
