import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { E1rmRollupWorker, E1RM_ROLLUP_QUEUE } from './e1rm-rollup.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: E1RM_ROLLUP_QUEUE,
    }),
  ],
  providers: [E1rmRollupWorker],
  exports: [BullModule],
})
export class WorkersModule {}