import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { LearnerModule } from './modules/learner/learner.module';
import { LearningContentModule } from './modules/learning-content/learning-content.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { SessionModule } from './modules/session/session.module';
import { ThemeModule } from './modules/theme/theme.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    LearnerModule,
    ThemeModule,
    LearningContentModule,
    SessionModule,
    ProgressModule,
    ReferenceModule,
    RealtimeModule,
  ],
})
export class AppModule {}
