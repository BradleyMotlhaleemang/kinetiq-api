import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExercisesService } from './exercises.service';

@UseGuards(AuthGuard('jwt'))
@Controller('exercises')
export class ExercisesController {
  constructor(private exercises: ExercisesService) {}

  @Get()
  findAll(@Query('primaryMuscle') primaryMuscle?: string,
          @Query('movementPattern') movementPattern?: string) {
    return this.exercises.findAll({ primaryMuscle, movementPattern });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercises.findOne(id);
  }

  @Get(':id/substitutions')
  substitutions(@Param('id') id: string, @Query('joint') joint?: string) {
    return this.exercises.findSubstitutions(id, joint);
  }
}