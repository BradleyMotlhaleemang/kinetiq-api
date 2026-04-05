import { Module } from '@nestjs/common';
import { GoalModeService } from './goal-mode.service';

@Module({
  providers: [GoalModeService],
  exports: [GoalModeService],
})
export class GoalModeModule {}