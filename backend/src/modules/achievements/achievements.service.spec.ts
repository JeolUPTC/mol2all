import { Test } from '@nestjs/testing'
import { AchievementsService } from './achievements.service'
import { PrismaService } from '../../prisma/prisma.service'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAchievement(
  id: string,
  condition: { type: string; value?: number; topic?: string },
) {
  return {
    id,
    code: id,
    name: `Achievement ${id}`,
    description: 'test',
    iconUrl: null,
    xpReward: 100,
    condition,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeProgress(levelId: string, status: string, stars: number, topic = 'molar_mass') {
  return {
    id: `p-${levelId}`,
    userId: 'user-1',
    levelId,
    status,
    stars,
    highScore: 100,
    attempts: 1,
    completedAt: status === 'COMPLETED' ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    level: { id: levelId, topic },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AchievementsService', () => {
  let service: AchievementsService
  let prisma: {
    achievement: { findMany: jest.Mock }
    userAchievement: { findMany: jest.Mock; createMany: jest.Mock }
    progress: { findMany: jest.Mock }
  }

  beforeEach(async () => {
    prisma = {
      achievement: { findMany: jest.fn() },
      userAchievement: { findMany: jest.fn(), createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      progress: { findMany: jest.fn() },
    }

    const module = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(AchievementsService)
  })

  describe('checkAndAward', () => {
    it('returns empty array when there are no achievements defined', async () => {
      prisma.achievement.findMany.mockResolvedValue([])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([])

      const result = await service.checkAndAward('user-1')

      expect(result).toEqual([])
      expect(prisma.userAchievement.createMany).not.toHaveBeenCalled()
    })

    it('does not award achievements already unlocked', async () => {
      const ach = makeAchievement('first_level', { type: 'level_complete', value: 1 })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([{ achievementId: 'first_level' }])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 1),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(0)
    })

    it('awards level_complete achievement when completed count meets threshold', async () => {
      const ach = makeAchievement('first_level', { type: 'level_complete', value: 1 })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 2),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('first_level')
      expect(prisma.userAchievement.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', achievementId: 'first_level' }],
        skipDuplicates: true,
      })
    })

    it('does not award level_complete when threshold not met', async () => {
      const ach = makeAchievement('three_levels', { type: 'level_complete', value: 3 })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 1),
        makeProgress('l2', 'IN_PROGRESS', 0),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(0)
    })

    it('awards stars achievement when any level has 3 stars', async () => {
      const ach = makeAchievement('perfect_score', { type: 'stars' })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 3),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('perfect_score')
    })

    it('does not award stars achievement when no level has 3 stars', async () => {
      const ach = makeAchievement('perfect_score', { type: 'stars' })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 2),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(0)
    })

    it('awards topic_complete achievement when the target topic is completed', async () => {
      const ach = makeAchievement('mol_master', { type: 'topic_complete', topic: 'molar_mass' })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 2, 'molar_mass'),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(1)
    })

    it('awards multiple achievements simultaneously', async () => {
      const achievements = [
        makeAchievement('first_level', { type: 'level_complete', value: 1 }),
        makeAchievement('perfect_score', { type: 'stars' }),
        makeAchievement('mol_master', { type: 'topic_complete', topic: 'molar_mass' }),
      ]
      prisma.achievement.findMany.mockResolvedValue(achievements)
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress('l1', 'COMPLETED', 3, 'molar_mass'),
      ])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(3)
    })

    it('ignores achievements with unknown condition type', async () => {
      const ach = makeAchievement('unknown', { type: 'unknown_type' as never })
      prisma.achievement.findMany.mockResolvedValue([ach])
      prisma.userAchievement.findMany.mockResolvedValue([])
      prisma.progress.findMany.mockResolvedValue([])

      const result = await service.checkAndAward('user-1')

      expect(result).toHaveLength(0)
    })
  })
})
