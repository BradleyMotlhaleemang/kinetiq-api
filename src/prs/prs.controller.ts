import {
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  Param,
  Query,
  UseGuards,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrsService } from './prs.service';

@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {}

const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.userId;
  },
);

@UseGuards(JwtAuthGuard)
@Controller('prs')
export class PrsController {
  constructor(private readonly prsService: PrsService) {}

  @Get('exercise/:exerciseId')
  getByExercise(
    @CurrentUser() userId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.prsService.getByExercise(userId, exerciseId);
  }

  @Get('recent')
  getRecent(
    @CurrentUser() userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.prsService.getRecent(userId, Number(limit) || 5);
  }

  @Get('mesocycle/:mesocycleId')
  getByMesocycle(
    @CurrentUser() userId: string,
    @Param('mesocycleId') mesocycleId: string,
  ) {
    return this.prsService.getByMesocycle(userId, mesocycleId);
  }
}
