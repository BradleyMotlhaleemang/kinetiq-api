import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BiofeedbackService } from './biofeedback.service';

@UseGuards(AuthGuard('jwt'))
@Controller('biofeedback')
export class BiofeedbackController {
  constructor(private biofeedback: BiofeedbackService) {}

  @Post()
  submit(
    @Request() req: any,
    @Body() body: {
      workoutId?: string;
      sorenessLog: Record<string, number>;
      jointPainLog: Record<string, number>;
      energyLevel: number;
      strengthRating: number;
      muscleFeel: number;
      sleepLastNight: number;
      overallWellbeing: number;
    },
  ) {
    return this.biofeedback.submit(req.user.userId, body);
  }

  @Get('latest')
  getLatest(@Request() req: any) {
    return this.biofeedback.getLatest(req.user.userId);
  }

  @Get('muscles/:workoutId')
getMusclesTrained(@Param('workoutId') workoutId: string) {
  return this.biofeedback.getMusclesTrained(workoutId);
}

  @Get('soreness/:muscle')
  getSorenessHistory(
    @Request() req: any,
    @Param('muscle') muscle: string,
  ) {
    return this.biofeedback.getSorenessHistory(req.user.userId, muscle);
  }
}