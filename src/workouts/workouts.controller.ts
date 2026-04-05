import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkoutsService } from './workouts.service';

@UseGuards(AuthGuard('jwt'))
@Controller('workouts')
export class WorkoutsController {
  constructor(private workouts: WorkoutsService) {}

  @Post()
  create(
    @Request() req: any,
    @Body() body: { mesocycleId?: string; splitDayLabel?: string },
  ) {
    return this.workouts.create(req.user.userId, body.mesocycleId, body.splitDayLabel);
  }

  @Get('history')
  history(@Request() req: any) {
    return this.workouts.findHistory(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.workouts.findOne(req.user.userId, id);
  }

  @Get(':id/prescription')
  getPrescription(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Query('exerciseId') exerciseId: string,
  ) {
    return this.workouts.getPrescription(req.user.userId, workoutId, exerciseId);
  }

  @Post(':id/sets')
  addSet(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Body() body: {
      exerciseId: string;
      setNumber: number;
      weight: number;
      reps: number;
      rpe?: number;
    },
  ) {
    return this.workouts.addSet(
      req.user.userId,
      workoutId,
      body.exerciseId,
      body.setNumber,
      body.weight,
      body.reps,
      body.rpe,
    );
  }

  @Patch(':id/sets/:setId')
  updateSet(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Param('setId') setId: string,
    @Body() body: { weight: number; reps: number; rpe?: number },
  ) {
    return this.workouts.updateSet(
      req.user.userId,
      workoutId,
      setId,
      body.weight,
      body.reps,
      body.rpe,
    );
  }

  @Patch(':id/complete')
  complete(@Request() req: any, @Param('id') id: string) {
    return this.workouts.complete(req.user.userId, id);
  }
}