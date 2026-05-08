import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      totalStudents,
      totalTeachers,
      totalCompletedSessions,
      allCompletedProgress,
      levels,
      recentSessions,
      topProfiles,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      this.prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
      this.prisma.gameSession.count({ where: { completed: true } }),
      this.prisma.progress.findMany({
        where: { status: 'COMPLETED' },
        select: { stars: true },
      }),
      this.prisma.level.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          progress: {
            where: { status: 'COMPLETED' },
            select: { stars: true, attempts: true },
          },
        },
      }),
      this.prisma.gameSession.findMany({
        where: { completed: true, startedAt: { gte: sevenDaysAgo } },
        select: { startedAt: true },
      }),
      this.prisma.profile.findMany({
        where: { user: { role: 'STUDENT', isActive: true } },
        orderBy: { totalXp: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              _count: {
                select: { progress: { where: { status: 'COMPLETED' } } },
              },
            },
          },
        },
      }),
    ])

    const totalCompletedLevels = allCompletedProgress.length
    const avgStarsOverall =
      allCompletedProgress.length > 0
        ? Math.round(
            (allCompletedProgress.reduce((s, p) => s + p.stars, 0) /
              allCompletedProgress.length) *
              10,
          ) / 10
        : 0

    // Activity: last 7 days (ordered oldest → newest)
    const activityMap = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      activityMap.set(d.toISOString().slice(0, 10), 0)
    }
    for (const s of recentSessions) {
      const date = s.startedAt.toISOString().slice(0, 10)
      const current = activityMap.get(date)
      if (current !== undefined) activityMap.set(date, current + 1)
    }
    const activity = Array.from(activityMap, ([date, sessions]) => ({ date, sessions }))

    // Level performance
    const levelPerformance = levels.map((l) => {
      const completions = l.progress
      const totalAttempts = completions.reduce((s, p) => s + p.attempts, 0)
      const avgStars =
        completions.length > 0
          ? Math.round(
              (completions.reduce((s, p) => s + p.stars, 0) / completions.length) * 10,
            ) / 10
          : 0
      return {
        levelId: l.id,
        levelName: l.name,
        levelOrder: l.order,
        topic: l.topic,
        completionCount: completions.length,
        totalAttempts,
        avgStars,
      }
    })

    // Top students by XP
    const topStudents = topProfiles.map((p) => ({
      id: p.user.id,
      username: p.user.username,
      displayName: p.displayName,
      totalXp: p.totalXp,
      completedLevels: p.user._count.progress,
    }))

    return {
      platform: {
        totalStudents,
        totalTeachers,
        totalCompletedSessions,
        totalCompletedLevels,
        avgStarsOverall,
      },
      activity,
      levelPerformance,
      topStudents,
    }
  }
}
