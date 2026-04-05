import { Module } from '@nestjs/common';
import { SubstitutionEngineService } from './substitution-engine.service';

@Module({
  providers: [SubstitutionEngineService],
  exports: [SubstitutionEngineService],
})
export class SubstitutionEngineModule {}