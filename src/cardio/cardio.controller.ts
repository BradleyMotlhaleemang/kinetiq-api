import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CardioService } from './cardio.service';

@UseGuards(AuthGuard('jwt'))
@Controller('cardio')
export class CardioController {
  constructor(private cardio: CardioService) {}

  @Post()
  logSession(
    @Request() req: any,
    @Body() body: {
      type: string;
      durationMinutes: number;
      distanceKm?: number;
      avgHeartRate?: number;
      peakHeartRate?: number;
      perceivedEffort: number;
    },
  ) {
    return this.cardio.logSession(req.user.userId, body);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.cardio.getHistory(req.user.userId);
  }
}