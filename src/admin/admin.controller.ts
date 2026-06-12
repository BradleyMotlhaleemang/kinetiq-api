import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { UpdateAdminExerciseDto } from './dto/update-admin-exercise.dto';
import { CreateAdminExerciseDto } from './dto/create-admin-exercise.dto';
import { UpdateMesocycleTemplateDto } from './dto/update-mesocycle-template.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateRoutineTemplateDto } from './dto/update-routine-template.dto';
import { ReplaceRoutineDaysDto } from './dto/replace-routine-days.dto';
import {
  CreateSubstitutionPoolDto,
  UpdateSubstitutionPoolDto,
  UpsertPoolExerciseDto,
} from './dto/substitution-pool.dto';
import {
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
  UpdateAnnouncementDto,
} from './dto/knowledge-admin.dto';

@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  getStats() {
    return this.admin.getStats();
  }

  @Get('activity')
  getActivity() {
    return this.admin.getActivity();
  }

  @Get('audit')
  listAudit(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('actorId') actorId?: string,
    @Query('entityType') entityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.admin.listAudit({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      actorId,
      entityType,
      from,
      to,
    });
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('analytics')
  getAnalytics() {
    return this.admin.getAnalytics();
  }

  // Users
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('users')
  listUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.admin.listUsers({
      search,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  updateUser(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.admin.updateUser(req.user.userId, id, body);
  }

  // Exercises
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('exercises')
  listExercises(@Query('search') search?: string) {
    return this.admin.listExercises(search);
  }

  @Get('exercises/profiles/equipment')
  listEquipmentProfiles() {
    return this.admin.listEquipmentProfiles();
  }

  @Get('exercises/profiles/execution')
  listExecutionProfiles() {
    return this.admin.listExecutionProfiles();
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('exercises/:id')
  getExercise(@Param('id') id: string) {
    return this.admin.getExercise(id);
  }

  @Post('exercises')
  createExercise(
    @Request() req: { user: { userId: string } },
    @Body() body: CreateAdminExerciseDto,
  ) {
    return this.admin.createExercise(req.user.userId, body);
  }

  @Patch('exercises/:id')
  updateExercise(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: UpdateAdminExerciseDto,
  ) {
    return this.admin.updateExercise(req.user.userId, id, body);
  }

  @Delete('exercises/:id')
  deleteExercise(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.admin.deleteExercise(req.user.userId, id);
  }

  // Substitution pools
  @Get('substitution-pools')
  listSubstitutionPools() {
    return this.admin.listSubstitutionPools();
  }

  @Post('substitution-pools')
  createSubstitutionPool(
    @Request() req: { user: { userId: string } },
    @Body() body: CreateSubstitutionPoolDto,
  ) {
    return this.admin.createSubstitutionPool(req.user.userId, body);
  }

  @Patch('substitution-pools/:id')
  updateSubstitutionPool(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: UpdateSubstitutionPoolDto,
  ) {
    return this.admin.updateSubstitutionPool(req.user.userId, id, body);
  }

  @Delete('substitution-pools/:id')
  deleteSubstitutionPool(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.admin.deleteSubstitutionPool(req.user.userId, id);
  }

  @Put('substitution-pools/:poolId/exercises')
  upsertPoolExercise(
    @Request() req: { user: { userId: string } },
    @Param('poolId') poolId: string,
    @Body() body: UpsertPoolExerciseDto,
  ) {
    return this.admin.upsertPoolExercise(req.user.userId, poolId, body);
  }

  @Delete('substitution-pools/:poolId/exercises/:exerciseId')
  removePoolExercise(
    @Request() req: { user: { userId: string } },
    @Param('poolId') poolId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.admin.removePoolExercise(req.user.userId, poolId, exerciseId);
  }

  // Templates
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('templates/programs')
  listPrograms() {
    return this.admin.listProgramTemplates();
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('templates/programs/:id')
  getProgram(@Param('id') id: string) {
    return this.admin.getProgramTemplate(id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('templates/programs/:id/duplicate')
  duplicateProgram(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.admin.duplicateProgram(req.user.userId, id);
  }

  @Patch('templates/programs/:id')
  updateProgram(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: UpdateMesocycleTemplateDto,
  ) {
    return this.admin.updateMesocycleTemplate(req.user.userId, id, body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Delete('templates/programs/:id')
  deleteProgram(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.admin.deleteProgramTemplate(req.user.userId, id);
  }

  @Get('templates/routines')
  listRoutines() {
    return this.admin.listRoutineTemplates();
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('templates/routines/:id')
  getRoutine(@Param('id') id: string) {
    return this.admin.getRoutineTemplate(id);
  }

  @Patch('templates/routines/:id')
  updateRoutine(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: UpdateRoutineTemplateDto,
  ) {
    return this.admin.updateRoutineTemplate(req.user.userId, id, body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Put('templates/routines/:id/days')
  replaceRoutineDays(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: ReplaceRoutineDaysDto,
  ) {
    return this.admin.replaceRoutineDays(req.user.userId, id, body);
  }

  // Knowledge & announcements
  @Get('knowledge')
  listKnowledge() {
    return this.admin.listKnowledge();
  }

  @Post('knowledge')
  createKnowledge(
    @Request() req: { user: { userId: string } },
    @Body() body: CreateKnowledgeDto,
  ) {
    return this.admin.createKnowledge(req.user.userId, body);
  }

  @Patch('knowledge/:id')
  updateKnowledge(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: UpdateKnowledgeDto,
  ) {
    return this.admin.updateKnowledge(req.user.userId, id, body);
  }

  @Delete('knowledge/:id')
  deleteKnowledge(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.admin.deleteKnowledge(req.user.userId, id);
  }

  @Get('announcement')
  getAnnouncement() {
    return this.admin.getAnnouncement();
  }

  @Patch('announcement')
  updateAnnouncement(
    @Request() req: { user: { userId: string } },
    @Body() body: UpdateAnnouncementDto,
  ) {
    return this.admin.updateAnnouncement(req.user.userId, body);
  }
}
