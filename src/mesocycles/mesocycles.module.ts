import { Module } from '@nestjs/common';
import { MesocyclesService } from './mesocycles.service';
import { MesocyclesController } from './mesocycles.controller';
import { GoalModeModule } from '../goal-mode/goal-mode.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [GoalModeModule, UsersModule],
  providers: [MesocyclesService],
  controllers: [MesocyclesController],
  exports: [MesocyclesService],
})
export class MesocyclesModule {}
