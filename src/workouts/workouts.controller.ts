import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkoutsService } from './workouts.service';
import { transformWorkout, transformPrescription } from '../common/transforms';

@UseGuards(AuthGuard('jwt'))
@Controller('workouts')
export class WorkoutsController {
  constructor(private workouts: WorkoutsService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body() body: { mesocycleId?: string; splitDayLabel?: string },
  ) {
    const workout = await this.workouts.create(req.user.userId, body.mesocycleId, body.splitDayLabel);
    return transformWorkout(workout);
  }

  @Get('history')
  async history(@Request() req: any) {
    const workouts = await this.workouts.findHistory(req.user.userId);
    return workouts.map(transformWorkout);
  }

  @Get('active')
  async findActive(@Request() req: any) {
    const workouts = await this.workouts.findActive(req.user.userId);
    return workouts.map(transformWorkout);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const workout = await this.workouts.findOne(req.user.userId, id);
    return transformWorkout(workout);
  }

  @Get(':id/prescription')
  async getPrescription(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Query('exerciseId') exerciseId: string,
  ) {
    const prescription = await this.workouts.getPrescription(req.user.userId, workoutId, exerciseId);
    return transformPrescription(prescription);
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
  async complete(@Request() req: any, @Param('id') id: string) {
    const workout = await this.workouts.complete(req.user.userId, id);
    return transformWorkout(workout);
  }
}