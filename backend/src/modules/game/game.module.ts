import { Module } from '@nestjs/common'
import { SessionsController } from './sessions/sessions.controller'
import { SessionsService } from './sessions/sessions.service'
import { ProgressService } from './progress/progress.service'
import { ProgressController } from './progress/progress.controller'
import { AchievementsModule } from '../achievements/achievements.module'

@Module({
  imports: [AchievementsModule],
  controllers: [SessionsController, ProgressController],
  providers: [SessionsService, ProgressService],
  exports: [SessionsService, ProgressService],
})
export class GameModule {}
