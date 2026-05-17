import { Module } from '@nestjs/common';
import { PrsController } from './prs.controller';
import { PrDetectionService } from './pr-detection.service';
import { PrsService } from './prs.service';

@Module({
  controllers: [PrsController],
  providers: [PrsService, PrDetectionService],
  exports: [PrsService, PrDetectionService],
})
export class PrsModule {}
