import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('e1rm/:exerciseId')
  getE1rmTrend(
    @Request() req: any,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.analytics.getE1rmTrend(req.user.userId, exerciseId);
  }

  @Get('volume/weekly')
  getWeeklyVolume(@Request() req: any) {
    return this.analytics.getWeeklyVolume(req.user.userId);
  }

  @Get('volume/trends')
  getVolumeTrends(@Request() req: any) {
    return this.analytics.getVolumeTrends(req.user.userId);
  }

  @Get('strength/trends')
  getStrengthTrends(@Request() req: any) {
    return this.analytics.getStrengthTrends(req.user.userId);
  }

  @Get('insights')
  getInsights(@Request() req: any) {
    return this.analytics.getInsights(req.user.userId);
  }

  @Get('sfr/:exerciseId')
  getSFRScore(
    @Request() req: any,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.analytics.getSFRScore(req.user.userId, exerciseId);
  }
}