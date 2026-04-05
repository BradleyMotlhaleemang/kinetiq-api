import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReadinessService } from './readiness.service';

@UseGuards(AuthGuard('jwt'))
@Controller('readiness')
export class ReadinessController {
  constructor(private readiness: ReadinessService) {}

  @Post('check-in')
  checkIn(
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
    return this.readiness.checkIn(
      req.user.userId,
      body.sleepScore,
      body.stressScore,
      body.nutritionScore,
      body.motivationScore,
      body.muscleReadinessScore,
      body.workoutId,
    );
  }

  @Get('latest')
  getLatest(@Request() req: any) {
    return this.readiness.getLatest(req.user.userId);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.readiness.getHistory(req.user.userId);
  }
}