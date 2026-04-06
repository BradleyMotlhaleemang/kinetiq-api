import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReadinessService } from './readiness.service';
import { transformReadiness } from '../common/transforms';

@UseGuards(AuthGuard('jwt'))
@Controller('readiness')
export class ReadinessController {
  constructor(private readiness: ReadinessService) {}

  @Post('check-in')
  async checkIn(
    @Request() req: any,
    @Body() body: {
      sleepScore: number;
      stressScore: number;
      nutritionScore: number;
      motivationScore: number;
      muscleReadinessScore: number;
      workoutId?: string;
    },
  ) {
    const result = await this.readiness.checkIn(
      req.user.userId,
      body.sleepScore,
      body.stressScore,
      body.nutritionScore,
      body.motivationScore,
      body.muscleReadinessScore,
      body.workoutId,
    );
    return transformReadiness(result);
  }

  @Get('latest')
  async getLatest(@Request() req: any) {
    const result = await this.readiness.getLatest(req.user.userId);
    return transformReadiness(result);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    const results = await this.readiness.getHistory(req.user.userId);
    return results.map(transformReadiness);
  }
}