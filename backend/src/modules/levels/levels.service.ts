import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllWithProgress(userId: string) {
    const [levels, progressList] = await Promise.all([
      this.prisma.level.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.progress.findMany({ where: { userId } }),
    ])

    const progressMap = new Map(progressList.map((p) => [p.levelId, p]))

    return levels.map((level, idx) => {
      const progress = progressMap.get(level.id) ?? null
      const previousLevel = idx > 0 ? levels[idx - 1] : null
      const previousProgress = previousLevel ? progressMap.get(previousLevel.id) : null
      const isUnlocked =
        level.order === 1 ||
        (previousProgress?.status === 'COMPLETED' && (previousProgress.stars ?? 0) >= 1)
      return { ...level, progress, isUnlocked }
    })
  }

  async findOne(id: string) {
    return this.prisma.level.findUniqueOrThrow({ where: { id } })
  }

  async findQuestions(levelId: string) {
    return this.prisma.levelQuestion.findMany({
      where: { levelId },
      include: {
        question: {
          select: {
            id: true,
            type: true,
            topic: true,
            stem: true,
            latexFormula: true,
            options: true,
            difficulty: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })
  }
}
