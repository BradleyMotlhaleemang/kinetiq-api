import { Module } from '@nestjs/common';
import { MesocyclesService } from './mesocycles.service';
import { MesocyclesController } from './mesocycles.controller';
import { GoalModeModule } from '../goal-mode/goal-mode.module';

@Module({
  imports: [GoalModeModule],
  providers: [MesocyclesService],
  controllers: [MesocyclesController],
  exports: [MesocyclesService],
})
export class MesocyclesModule {}