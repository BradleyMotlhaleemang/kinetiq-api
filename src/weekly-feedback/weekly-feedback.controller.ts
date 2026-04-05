import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WeeklyFeedbackService } from './weekly-feedback.service';

@UseGuards(AuthGuard('jwt'))
@Controller('feedback/weekly')
export class WeeklyFeedbackController {
  constructor(private weeklyFeedback: WeeklyFeedbackService) {}

  @Post()
  submit(
    @Request() req: any,
    @Body() body: {
      mesocycleId?: string;
      weekNumber: number;
      motivationScore: number;
      fatiguePerception: number;
      performanceFeeling: number;
      energyLevelAvg?: number;
      sleepQualityAvg?: number;
      stressLevelAvg?: number;
      jointPainMap?: Record<string, number>;
      notes?: string;
    },
  ) {
    return this.weeklyFeedback.submit(req.user.userId, body);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.weeklyFeedback.getHistory(req.user.userId);
  }

  @Get('summary/:weekNumber')
  getByWeek(
    @Request() req: any,
    @Param('weekNumber') weekNumber: string,
  ) {
    return this.weeklyFeedback.getByWeek(req.user.userId, parseInt(weekNumber));
  }
}