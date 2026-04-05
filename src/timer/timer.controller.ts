import { Controller, Get, Post, Patch, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TimerService } from './timer.service';

@UseGuards(AuthGuard('jwt'))
@Controller('timer')
export class TimerController {
  constructor(private timer: TimerService) {}

  @Get('preference')
  getPreference(
    @Request() req: any,
    @Query('exerciseId') exerciseId?: string,
  ) {
    return this.timer.getPreference(req.user.userId, exerciseId);
  }

  @Patch('preference')
  upsertPreference(
    @Request() req: any,
    @Body() body: { restSeconds: number; exerciseId?: string },
  ) {
    return this.timer.upsertPreference(
      req.user.userId,
      body.restSeconds,
      body.exerciseId,
    );
  }

  @Post('rest-log')
  logRest(
    @Request() req: any,
    @Body() body: {
      workoutId: string;
      setId: string;
      actualRestSeconds: number;
      previousSetId?: string;
    },
  ) {
    return this.timer.logRest(
      req.user.userId,
      body.workoutId,
      body.setId,
      body.actualRestSeconds,
      body.previousSetId,
    );
  }

  @Get('rest-history')
  getRestHistory(
    @Request() req: any,
    @Query('workoutId') workoutId: string,
  ) {
    return this.timer.getRestHistory(req.user.userId, workoutId);
  }
}