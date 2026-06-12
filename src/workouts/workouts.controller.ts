import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
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

  @Get('completion-advisory')
  async completionAdvisory(
    @Request() req: any,
    @Query('excludeWorkoutId') excludeWorkoutId?: string,
    @Query('completedAfter') completedAfter?: string,
    @Query('completedBefore') completedBefore?: string,
  ) {
    return this.workouts.getCompletionAdvisory(
      req.user.userId,
      excludeWorkoutId,
      completedAfter,
      completedBefore,
    );
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const workout = await this.workouts.findOne(req.user.userId, id);
    return transformWorkout(workout);
  }

  @Get(':id/exercises')
  getExercises(@Request() req: any, @Param('id') id: string) {
    return this.workouts.getWorkoutExercises(req.user.userId, id);
  }

  @Post(':id/exercises')
  addExercise(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Body() body: { exerciseId: string },
  ) {
    return this.workouts.addWorkoutExercise(req.user.userId, workoutId, body.exerciseId);
  }

  @Delete(':id/exercises/:workoutExerciseId')
  removeExercise(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Param('workoutExerciseId') workoutExerciseId: string,
  ) {
    return this.workouts.removeWorkoutExercise(
      req.user.userId,
      workoutId,
      workoutExerciseId,
    );
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Get(':id/prescription')
  async getPrescription(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Query('exerciseId') exerciseId: string,
  ) {
    const prescription = await this.workouts.getPrescription(req.user.userId, workoutId, exerciseId);
    return transformPrescription(prescription);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Get(':id/exercises/:exerciseId/load-advisory')
  getLoadAdvisory(
    @Request() req: any,
    @Param('id') workoutId: string,
    @Param('exerciseId') exerciseId: string,
    @Query('weight') weight: string,
    @Query('reps') reps: string,
  ) {
    return this.workouts.getLoadAdvisory(
      req.user.userId,
      workoutId,
      exerciseId,
      parseFloat(weight),
      parseInt(reps, 10),
    );
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

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Patch(':id/complete')
  async complete(@Request() req: any, @Param('id') id: string) {
    const workout = await this.workouts.complete(req.user.userId, id);
    return transformWorkout(workout);
  }
}