import { Module } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { ProgressionEngineModule } from '../progression-engine/progression-engine.module';
import { ReadinessModule } from '../readiness/readiness.module';
import { GoalModeModule } from '../goal-mode/goal-mode.module';
import { WeeklyFeedbackModule } from '../weekly-feedback/weekly-feedback.module';
import { WorkersModule } from '../workers/workers.module';
import { BullModule } from '@nestjs/bull';
import { E1RM_ROLLUP_QUEUE } from '../workers/e1rm-rollup.worker';

@Module({
  imports: [
    ProgressionEngineModule,
    ReadinessModule,
    GoalModeModule,
    WeeklyFeedbackModule,
    WorkersModule,
    BullModule.registerQueue({ name: E1RM_ROLLUP_QUEUE }),
  ],
  providers: [WorkoutsService],
  controllers: [WorkoutsController],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}