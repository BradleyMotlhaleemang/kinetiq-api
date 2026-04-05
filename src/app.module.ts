import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExercisesModule } from './exercises/exercises.module';
import { GoalModeModule } from './goal-mode/goal-mode.module';
import { MesocyclesModule } from './mesocycles/mesocycles.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { ReadinessModule } from './readiness/readiness.module';
import { WeeklyFeedbackModule } from './weekly-feedback/weekly-feedback.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ProgressionEngineModule } from './progression-engine/progression-engine.module';
import { WorkersModule } from './workers/workers.module';
import { BiofeedbackModule } from './biofeedback/biofeedback.module';
import { BodyMetricsModule } from './body-metrics/body-metrics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubstitutionEngineModule } from './substitution-engine/substitution-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    GoalModeModule,
    MesocyclesModule,
    WorkoutsModule,
    ReadinessModule,
    WeeklyFeedbackModule,
    KnowledgeModule,
    ProgressionEngineModule,
    WorkersModule,
    BiofeedbackModule,
    BodyMetricsModule,
    NotificationsModule,
    SubstitutionEngineModule,
  ],
})
export class AppModule {}