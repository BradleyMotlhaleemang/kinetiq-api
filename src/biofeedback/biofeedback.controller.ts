import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BiofeedbackService } from './biofeedback.service';
import { CreateBiofeedbackDto } from './dto/create-biofeedback.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('biofeedback')
export class BiofeedbackController {
  constructor(private biofeedback: BiofeedbackService) {}

  @Post()
  submit(@Request() req: any, @Body() body: CreateBiofeedbackDto) {
    return this.biofeedback.submit(req.user.userId, body);
  }

  @Get('latest')
  getLatest(@Request() req: any) {
    return this.biofeedback.getLatest(req.user.userId);
  }

  @Get('pre-population')
  getPrePopulation(
    @Request() req: any,
    @Query('workoutId') workoutId: string,
  ) {
    return this.biofeedback.getPrePopulation(req.user.userId, workoutId);
  }

  @Get('muscles/:workoutId')
  getMusclesTrained(
    @Request() req: any,
    @Param('workoutId') workoutId: string,
  ) {
    return this.biofeedback.getMusclesTrained(req.user.userId, workoutId);
  }

  @Get('soreness/:muscle')
  getSorenessHistory(
    @Request() req: any,
    @Param('muscle') muscle: string,
  ) {
    return this.biofeedback.getSorenessHistory(req.user.userId, muscle);
  }
}