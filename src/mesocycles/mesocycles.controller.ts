import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MesocyclesService } from './mesocycles.service';

@UseGuards(AuthGuard('jwt'))
@Controller('mesocycles')
export class MesocyclesController {
  constructor(private mesocycles: MesocyclesService) {}

  @Post('generate')
  generate(
    @Request() req: any,
    @Body() body: { name: string; totalWeeks: number; templateId?: string },
  ) {
    return this.mesocycles.generate(req.user.userId, body.name, body.totalWeeks, body.templateId);
  }

  @Get('active')
  findActive(@Request() req: any) {
    return this.mesocycles.findActive(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.mesocycles.findOne(req.user.userId, id);
  }

  @Patch(':id/close')
  close(@Request() req: any, @Param('id') id: string) {
    return this.mesocycles.close(req.user.userId, id);
  }

  @Get(':id/volume-status')
  volumeStatus(@Request() req: any, @Param('id') id: string) {
    return this.mesocycles.getVolumeStatus(req.user.userId, id);
  }
}