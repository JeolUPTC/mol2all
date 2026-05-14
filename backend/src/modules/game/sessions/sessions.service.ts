import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { AchievementsService } from '../../achievements/achievements.service'

interface CreateSessionDto {
  levelId: string
}

interface SubmitAnswerDto {
  questionId: string
  answer: unknown
  timeSpent: number
}

interface CompleteSessionDto {
  score: number
  stars: number
  timeSpent: number
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    const level = await this.prisma.level.findUniqueOrThrow({ where: { id: dto.levelId } })

    if (level.order > 1) {
      const previousLevel = await this.prisma.level.findFirst({
        where: { order: level.order - 1, isActive: true },
      })
      if (previousLevel) {
        const previousProgress = await this.prisma.progress.findUnique({
          where: { userId_levelId: { userId, levelId: previousLevel.id } },
        })
        if (!previousProgress || previousProgress.status !== 'COMPLETED') {
          throw new ForbiddenException('Debes completar el nivel anterior primero')
        }
      }
    }

    return this.prisma.gameSession.create({
      data: { userId, levelId: dto.levelId },
    })
  }

  async submitAnswer(sessionId: string, userId: string, dto: SubmitAnswerDto) {
    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Sesión no encontrada')
    if (session.userId !== userId) throw new ForbiddenException()
    if (session.completed) throw new ForbiddenException('La sesión ya fue completada')

    const question = await this.prisma.question.findUniqueOrThrow({
      where: { id: dto.questionId },
    })

    const isCorrect = this.evaluateAnswer(question.correctAnswer, dto.answer)

    const answer = await this.prisma.sessionAnswer.create({
      data: {
        sessionId,
        questionId: dto.questionId,
        answer: dto.answer as never,
        isCorrect,
        timeSpent: dto.timeSpent,
      },
    })

    if (!isCorrect) {
      await this.prisma.gameSession.update({
        where: { id: sessionId },
        data: { lives: { decrement: 1 } },
      })
    }

    return { isCorrect, answer }
  }

  async complete(sessionId: string, userId: string, dto: CompleteSessionDto) {
    const session = await this.prisma.gameSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Sesión no encontrada')
    if (session.userId !== userId) throw new ForbiddenException()

    // Gather existing progress and level data before the transaction
    const [existingProgress, level] = await Promise.all([
      this.prisma.progress.findUnique({
        where: { userId_levelId: { userId, levelId: session.levelId } },
      }),
      this.prisma.level.findUnique({ where: { id: session.levelId } }),
    ])

    // Always preserve the best result across replays
    const bestStars = Math.max(dto.stars, existingProgress?.stars ?? 0)
    const bestScore = Math.max(dto.score, existingProgress?.highScore ?? 0)
    const xpEarned = dto.stars * 50 + Math.floor(dto.score / 10)
    const coinsEarned = level?.coinsReward ?? 0

    await this.prisma.$transaction([
      this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          score: dto.score,
          timeSpent: dto.timeSpent,
          completed: true,
          endedAt: new Date(),
        },
      }),
      this.prisma.progress.upsert({
        where: { userId_levelId: { userId, levelId: session.levelId } },
        update: {
          status: 'COMPLETED',
          stars: bestStars,
          highScore: bestScore,
          attempts: { increment: 1 },
          completedAt: new Date(),
        },
        create: {
          userId,
          levelId: session.levelId,
          status: 'COMPLETED',
          stars: dto.stars,
          highScore: dto.score,
          attempts: 1,
          completedAt: new Date(),
        },
      }),
      this.prisma.profile.update({
        where: { userId },
        data: {
          totalXp: { increment: xpEarned },
          totalCoins: { increment: coinsEarned },
        },
      }),
    ])

    const newAchievements = await this.achievementsService.checkAndAward(userId)

    return { xpEarned, coinsEarned, newAchievements }
  }

  private evaluateAnswer(correct: unknown, submitted: unknown): boolean {
    return JSON.stringify(correct) === JSON.stringify(submitted)
  }
}
