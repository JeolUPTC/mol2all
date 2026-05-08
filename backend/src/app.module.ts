import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { LevelsModule } from './modules/levels/levels.module'
import { QuestionsModule } from './modules/questions/questions.module'
import { GameModule } from './modules/game/game.module'
import { AchievementsModule } from './modules/achievements/achievements.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { TeacherModule } from './modules/teacher/teacher.module'
import { AdminModule } from './modules/admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // ventana de 1 minuto
        limit: 120,    // máximo 120 peticiones por minuto (usuarios normales)
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    LevelsModule,
    QuestionsModule,
    GameModule,
    AchievementsModule,
    AnalyticsModule,
    TeacherModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
