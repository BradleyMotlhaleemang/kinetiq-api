import { Module } from '@nestjs/common';
import { CardioService } from './cardio.service';
import { CardioController } from './cardio.controller';

@Module({
  providers: [CardioService],
  controllers: [CardioController],
  exports: [CardioService],
})
export class CardioModule {}