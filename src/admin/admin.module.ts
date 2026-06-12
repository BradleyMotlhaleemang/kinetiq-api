import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminGuard } from './admin.guard';
import { TemplatesModule } from '../templates/templates.module';
import { ExercisesModule } from '../exercises/exercises.module';

@Module({
  imports: [TemplatesModule, ExercisesModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditService, AdminGuard],
  exports: [AdminAuditService, AdminGuard],
})
export class AdminModule {}
