import { Module } from '@nestjs/common';
import { VolumeProgressionService } from './volume-progression.service';

@Module({
  providers: [VolumeProgressionService],
  exports: [VolumeProgressionService],
})
export class ProgressionModule {}
