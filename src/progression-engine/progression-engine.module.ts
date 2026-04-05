import { Module } from '@nestjs/common';
import { ProgressionEngineService } from './progression-engine.service';

@Module({
  providers: [ProgressionEngineService],
  exports: [ProgressionEngineService],
})
export class ProgressionEngineModule {}