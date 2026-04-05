import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { E1rmRollupWorker, E1RM_ROLLUP_QUEUE } from './e1rm-rollup.worker';
import { SflDailyUpdateWorker, SFL_DAILY_UPDATE_QUEUE } from './sfl-daily-update.worker';
import { SfrWorker, SFR_QUEUE } from './sfr.worker';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: E1RM_ROLLUP_QUEUE },
      { name: SFL_DAILY_UPDATE_QUEUE },
      { name: SFR_QUEUE },
    ),
  ],
  providers: [E1rmRollupWorker, SflDailyUpdateWorker, SfrWorker],
  exports: [BullModule],
})
export class WorkersModule {}