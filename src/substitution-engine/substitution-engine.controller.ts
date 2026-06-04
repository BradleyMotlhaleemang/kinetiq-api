import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfirmSubstitutionDto } from './dto/confirm-substitution.dto';
import { SubstitutionEngineService } from './substitution-engine.service';

@UseGuards(AuthGuard('jwt'))
@Controller('substitutions')
export class SubstitutionEngineController {
  constructor(
    private readonly substitutionEngine: SubstitutionEngineService,
  ) {}

  @Post('confirm')
  async confirm(
    @Request() req: any,
    @Body() body: ConfirmSubstitutionDto,
  ) {
    return this.substitutionEngine.confirmSubstitution(req.user.userId, body);
  }

  @Get('active')
  async getActive(@Request() req: any) {
    return this.substitutionEngine.getActive(req.user.userId);
  }

  @Patch(':id/review')
  async review(
    @Request() req: any,
    @Param('id') id: string,
    @Body('newPainScore') newPainScore: number,
  ) {
    return this.substitutionEngine.review(req.user.userId, id, newPainScore);
  }
}
