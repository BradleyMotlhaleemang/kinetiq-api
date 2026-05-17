import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { E1rmRollupWorker, E1RM_ROLLUP_QUEUE } from './e1rm-rollup.worker';
import { SflDailyUpdateWorker, SFL_DAILY_UPDATE_QUEUE } from './sfl-daily-update.worker';
import { SfrWorker, SFR_QUEUE } from './sfr.worker';
import { MesocycleAdvanceWorker } from './mesocycle-advance.worker';
import {
  BiofeedbackPromptWorker,
  BIOFEEDBACK_PROMPT_QUEUE,
} from './biofeedback-prompt.worker';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrsModule } from '../prs/prs.module';

@Module({
  imports: [
    NotificationsModule,
    PrsModule,
    BullModule.registerQueue(
      { name: E1RM_ROLLUP_QUEUE },
      { name: SFL_DAILY_UPDATE_QUEUE },
      { name: SFR_QUEUE },
      { name: BIOFEEDBACK_PROMPT_QUEUE },
    ),
  ],
  providers: [
    E1rmRollupWorker,
    SflDailyUpdateWorker,
    SfrWorker,
    MesocycleAdvanceWorker,
    BiofeedbackPromptWorker,
  ],
  exports: [BullModule],
})
export class WorkersModule {}