import { Test } from '@nestjs/testing'
import { LevelsService } from './levels.service'
import { PrismaService } from '../../prisma/prisma.service'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLevel(overrides: Partial<{ id: string; order: number; isActive: boolean }> = {}) {
  return {
    id: overrides.id ?? 'level-1',
    order: overrides.order ?? 1,
    name: 'Test Level',
    description: null,
    topic: 'molar_mass',
    difficulty: 1,
    xpReward: 100,
    coinsReward: 50,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeProgress(overrides: Partial<{
  levelId: string
  status: string
  stars: number
  highScore: number
}> = {}) {
  return {
    id: 'progress-1',
    userId: 'user-1',
    levelId: overrides.levelId ?? 'level-1',
    status: overrides.status ?? 'COMPLETED',
    stars: overrides.stars ?? 1,
    highScore: overrides.highScore ?? 100,
    attempts: 1,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LevelsService', () => {
  let service: LevelsService
  let prisma: { level: { findMany: jest.Mock }; progress: { findMany: jest.Mock } }

  beforeEach(async () => {
    prisma = {
      level: { findMany: jest.fn() },
      progress: { findMany: jest.fn() },
    }

    const module = await Test.createTestingModule({
      providers: [
        LevelsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(LevelsService)
  })

  describe('findAllWithProgress — unlock logic', () => {
    it('marks level 1 as unlocked regardless of progress', async () => {
      const level1 = makeLevel({ id: 'l1', order: 1 })
      prisma.level.findMany.mockResolvedValue([level1])
      prisma.progress.findMany.mockResolvedValue([])

      const result = await service.findAllWithProgress('user-1')

      expect(result[0].isUnlocked).toBe(true)
    })

    it('locks level 2 when level 1 has no progress', async () => {
      const [l1, l2] = [makeLevel({ id: 'l1', order: 1 }), makeLevel({ id: 'l2', order: 2 })]
      prisma.level.findMany.mockResolvedValue([l1, l2])
      prisma.progress.findMany.mockResolvedValue([])

      const result = await service.findAllWithProgress('user-1')

      expect(result[1].isUnlocked).toBe(false)
    })

    it('locks level 2 when level 1 is IN_PROGRESS', async () => {
      const [l1, l2] = [makeLevel({ id: 'l1', order: 1 }), makeLevel({ id: 'l2', order: 2 })]
      prisma.level.findMany.mockResolvedValue([l1, l2])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress({ levelId: 'l1', status: 'IN_PROGRESS', stars: 0 }),
      ])

      const result = await service.findAllWithProgress('user-1')

      expect(result[1].isUnlocked).toBe(false)
    })

    it('locks level 2 when level 1 is COMPLETED with 0 stars', async () => {
      const [l1, l2] = [makeLevel({ id: 'l1', order: 1 }), makeLevel({ id: 'l2', order: 2 })]
      prisma.level.findMany.mockResolvedValue([l1, l2])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress({ levelId: 'l1', status: 'COMPLETED', stars: 0 }),
      ])

      const result = await service.findAllWithProgress('user-1')

      expect(result[1].isUnlocked).toBe(false)
    })

    it('unlocks level 2 when level 1 is COMPLETED with ≥1 star', async () => {
      const [l1, l2] = [makeLevel({ id: 'l1', order: 1 }), makeLevel({ id: 'l2', order: 2 })]
      prisma.level.findMany.mockResolvedValue([l1, l2])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress({ levelId: 'l1', status: 'COMPLETED', stars: 1 }),
      ])

      const result = await service.findAllWithProgress('user-1')

      expect(result[1].isUnlocked).toBe(true)
    })

    it('attaches existing progress to the matching level and null to unstarted levels', async () => {
      const [l1, l2] = [makeLevel({ id: 'l1', order: 1 }), makeLevel({ id: 'l2', order: 2 })]
      const progress = makeProgress({ levelId: 'l1', status: 'COMPLETED', stars: 3 })
      prisma.level.findMany.mockResolvedValue([l1, l2])
      prisma.progress.findMany.mockResolvedValue([progress])

      const result = await service.findAllWithProgress('user-1')

      expect(result[0].progress).toEqual(progress)
      expect(result[1].progress).toBeNull()
    })

    it('propagates unlock through a chain: only level 3 stays locked when level 2 is incomplete', async () => {
      const [l1, l2, l3] = [
        makeLevel({ id: 'l1', order: 1 }),
        makeLevel({ id: 'l2', order: 2 }),
        makeLevel({ id: 'l3', order: 3 }),
      ]
      prisma.level.findMany.mockResolvedValue([l1, l2, l3])
      prisma.progress.findMany.mockResolvedValue([
        makeProgress({ levelId: 'l1', status: 'COMPLETED', stars: 2 }),
      ])

      const result = await service.findAllWithProgress('user-1')

      expect(result[0].isUnlocked).toBe(true)
      expect(result[1].isUnlocked).toBe(true)
      expect(result[2].isUnlocked).toBe(false)
    })
  })
})
