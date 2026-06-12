import { Module } from '@nestjs/common';
import { SubstitutionEngineController } from './substitution-engine.controller';
import { SubstitutionEngineService } from './substitution-engine.service';
import { MesocyclesModule } from '../mesocycles/mesocycles.module';

@Module({
  imports: [MesocyclesModule],
  controllers: [SubstitutionEngineController],
  providers: [SubstitutionEngineService],
  exports: [SubstitutionEngineService],
})
export class SubstitutionEngineModule {}
