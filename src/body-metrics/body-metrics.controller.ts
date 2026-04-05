import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BodyMetricsService } from './body-metrics.service';

@UseGuards(AuthGuard('jwt'))
@Controller('metrics')
export class BodyMetricsController {
  constructor(private bodyMetrics: BodyMetricsService) {}

  @Post('weight')
  logWeight(
    @Request() req: any,
    @Body() body: { weightKg: number; bodyFatPercent?: number },
  ) {
    return this.bodyMetrics.logWeight(
      req.user.userId,
      body.weightKg,
      body.bodyFatPercent,
    );
  }

  @Get('weight/history')
  getHistory(@Request() req: any) {
    return this.bodyMetrics.getHistory(req.user.userId);
  }

  @Get('weight/trend')
  getTrend(@Request() req: any) {
    return this.bodyMetrics.getTrend(req.user.userId);
  }
}