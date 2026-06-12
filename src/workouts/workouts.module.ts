import { Module } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { ProgressionEngineModule } from '../progression-engine/progression-engine.module';
import { ProgressionModule } from '../engine/progression/progression.module';
import { GoalModeModule } from '../goal-mode/goal-mode.module';
import { WorkersModule } from '../workers/workers.module';
import { BiofeedbackModule } from '../biofeedback/biofeedback.module';
import { BullModule } from '@nestjs/bull';
import { E1RM_ROLLUP_QUEUE } from '../workers/e1rm-rollup.worker';
import { BIOFEEDBACK_PROMPT_QUEUE } from '../workers/biofeedback-prompt.worker';
import { SubstitutionEngineModule } from '../substitution-engine/substitution-engine.module';
import { ExerciseActivationService } from './exercise-activation.service';
import { LoadAdvisoryService } from './load-advisory.service';

@Module({
  imports: [
    ProgressionEngineModule,
    ProgressionModule,
    GoalModeModule,
    WorkersModule,
    BiofeedbackModule,
    BullModule.registerQueue({ name: E1RM_ROLLUP_QUEUE }),
    BullModule.registerQueue({ name: BIOFEEDBACK_PROMPT_QUEUE }),
    SubstitutionEngineModule,
  ],
  providers: [WorkoutsService, ExerciseActivationService, LoadAdvisoryService],
  controllers: [WorkoutsController],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
