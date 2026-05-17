import { Module } from '@nestjs/common';
import { SubstitutionEngineController } from './substitution-engine.controller';
import { SubstitutionEngineService } from './substitution-engine.service';

@Module({
  controllers: [SubstitutionEngineController],
  providers: [SubstitutionEngineService],
  exports: [SubstitutionEngineService],
})
export class SubstitutionEngineModule {}