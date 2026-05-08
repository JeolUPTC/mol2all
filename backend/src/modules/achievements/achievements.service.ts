import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { Achievement } from '@prisma/client'

interface AchievementCondition {
  type: 'level_complete' | 'stars' | 'topic_complete'
  value?: number
  topic?: string
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAndAward(userId: string): Promise<Achievement[]> {
    const [achievements, unlockedRows, allProgress] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      this.prisma.progress.findMany({
        where: { userId },
        include: { level: true },
      }),
    ])

    const unlockedIds = new Set(unlockedRows.map((r) => r.achievementId))
    const completed = allProgress.filter((p) => p.status === 'COMPLETED')
    const threeStarLevels = allProgress.filter((p) => p.stars === 3)

    const toAward = achievements.filter((a) => {
      if (unlockedIds.has(a.id)) return false
      const cond = a.condition as unknown as AchievementCondition
      switch (cond.type) {
        case 'level_complete':
          return completed.length >= (cond.value ?? 1)
        case 'stars':
          return threeStarLevels.length >= 1
        case 'topic_complete':
          if (!cond.topic) return false
          return completed.some((p) => p.level.topic === cond.topic)
        default:
          return false
      }
    })

    if (toAward.length > 0) {
      await this.prisma.userAchievement.createMany({
        data: toAward.map((a) => ({ userId, achievementId: a.id })),
        skipDuplicates: true,
      })
    }

    return toAward
  }
}
