import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { QuestionType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

interface CreateQuestionDto {
  type: QuestionType
  topic: string
  difficulty: number
  stem: string
  options?: { id: string; text: string }[]
  correctAnswer: object
  explanation: string
}

interface CreateStudentDto {
  email: string
  username: string
  displayName: string
  password: string
  groupId?: string
}

function cell(value: string): string {
  const s = String(value)
  return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Groups ──────────────────────────────────────────────────────────────────

  async getMyGroups(teacherId: string) {
    return this.prisma.group.findMany({
      where: { teacherId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { students: true } },
      },
    })
  }

  async getGroupStudents(groupId: string, teacherId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } })
    if (!group) throw new NotFoundException('Grupo no encontrado')
    if (group.teacherId !== teacherId) throw new ForbiddenException('No tienes acceso a este grupo')

    return this.prisma.user.findMany({
      where: { groupId, role: 'STUDENT' },
      select: {
        id: true, email: true, username: true, isActive: true, createdAt: true,
        profile: { select: { displayName: true, totalXp: true, totalCoins: true } },
        _count: { select: { progress: { where: { status: 'COMPLETED' } } } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async assignStudentToGroup(groupId: string, studentId: string, teacherId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } })
    if (!group) throw new NotFoundException('Grupo no encontrado')
    if (group.teacherId !== teacherId) throw new ForbiddenException('No tienes acceso a este grupo')

    const student = await this.prisma.user.findUnique({ where: { id: studentId } })
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Estudiante no encontrado')

    return this.prisma.user.update({
      where: { id: studentId },
      data: { groupId },
      select: { id: true, username: true, groupId: true },
    })
  }

  async removeStudentFromGroup(groupId: string, studentId: string, teacherId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } })
    if (!group) throw new NotFoundException('Grupo no encontrado')
    if (group.teacherId !== teacherId) throw new ForbiddenException('No tienes acceso a este grupo')

    return this.prisma.user.update({
      where: { id: studentId },
      data: { groupId: null },
      select: { id: true, username: true, groupId: true },
    })
  }

  async getUnassignedStudents() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT', groupId: null, isActive: true },
      select: {
        id: true, username: true,
        profile: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // ── Students ────────────────────────────────────────────────────────────────

  async createStudent(teacherId: string, dto: CreateStudentDto) {
    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } })
      if (!group) throw new NotFoundException('Grupo no encontrado')
      if (group.teacherId !== teacherId) throw new ForbiddenException('No tienes acceso a este grupo')
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    })
    if (exists) {
      throw new ConflictException(
        exists.email === dto.email ? 'El correo ya está en uso' : 'El nombre de usuario ya está en uso',
      )
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS)
    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashed,
        role: 'STUDENT',
        groupId: dto.groupId ?? null,
        profile: { create: { displayName: dto.displayName } },
      },
      select: {
        id: true, email: true, username: true, role: true, isActive: true, groupId: true,
        profile: { select: { displayName: true } },
        group: { select: { id: true, name: true } },
      },
    })
  }

  async getStudentProgress(studentId: string) {
    return this.prisma.progress.findMany({
      where: { userId: studentId },
      include: { level: true },
      orderBy: { level: { order: 'asc' } },
    })
  }

  async resetStudentProgress(studentId: string) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } })
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Estudiante no encontrado')
    await this.prisma.$transaction([
      this.prisma.progress.deleteMany({ where: { userId: studentId } }),
      this.prisma.profile.update({
        where: { userId: studentId },
        data: { totalXp: 0, totalCoins: 0 },
      }),
    ])
    return { message: 'Progreso reiniciado correctamente' }
  }

  // ── Analytics ───────────────────────────────────────────────────────────────

  async getTeacherAnalytics(teacherId: string) {
    const groups = await this.prisma.group.findMany({
      where: { teacherId, isActive: true },
      select: {
        id: true,
        name: true,
        students: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, totalXp: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const allStudents = groups.flatMap((g) => g.students.map((s) => ({ ...s, groupName: g.name })))
    const studentIds = allStudents.map((s) => s.id)
    const totalStudents = allStudents.length

    const [completedProgress, levels] = await Promise.all([
      studentIds.length > 0
        ? this.prisma.progress.findMany({
            where: { userId: { in: studentIds }, status: 'COMPLETED' },
            select: { userId: true, levelId: true, stars: true },
          })
        : Promise.resolve([]),
      this.prisma.level.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, order: true },
      }),
    ])

    const studentLevelCount = new Map<string, number>()
    const levelCompletionMap = new Map<string, number>()
    const starsCount: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
    for (const p of completedProgress) {
      studentLevelCount.set(p.userId, (studentLevelCount.get(p.userId) ?? 0) + 1)
      levelCompletionMap.set(p.levelId, (levelCompletionMap.get(p.levelId) ?? 0) + 1)
      if (p.stars >= 1 && p.stars <= 3) starsCount[p.stars]++
    }

    const totalXp = allStudents.reduce((s, u) => s + (u.profile?.totalXp ?? 0), 0)
    const totalLevels = Array.from(studentLevelCount.values()).reduce((s, c) => s + c, 0)
    const activeStudents = allStudents.filter((s) => (studentLevelCount.get(s.id) ?? 0) > 0).length

    const levelCompletion = levels.map((l) => {
      const completions = levelCompletionMap.get(l.id) ?? 0
      return {
        levelName: l.name,
        order: l.order,
        completions,
        pct: totalStudents > 0 ? Math.round((completions / totalStudents) * 100) : 0,
      }
    })

    const groupComparison = groups.map((g) => {
      const count = g.students.length
      const gXp = g.students.reduce((s, u) => s + (u.profile?.totalXp ?? 0), 0)
      return { name: g.name, avgXp: count > 0 ? Math.round(gXp / count) : 0, studentCount: count }
    })

    const topStudents = allStudents
      .map((s) => ({
        displayName: s.profile?.displayName ?? s.username,
        totalXp: s.profile?.totalXp ?? 0,
        levelsCompleted: studentLevelCount.get(s.id) ?? 0,
        groupName: s.groupName,
      }))
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 5)

    return {
      kpis: {
        totalStudents,
        avgXp: totalStudents > 0 ? Math.round(totalXp / totalStudents) : 0,
        avgLevels: totalStudents > 0 ? Math.round((totalLevels / totalStudents) * 10) / 10 : 0,
        activeStudentPct: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
      },
      levelCompletion,
      starsDistribution: [1, 2, 3].map((stars) => ({ stars, count: starsCount[stars] })),
      groupComparison,
      topStudents,
    }
  }

  // ── Summary (kept for backward compat) ─────────────────────────────────────

  async getSummary() {
    const [totalStudents, totalCompletedSessions, levels] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      this.prisma.gameSession.count({ where: { completed: true } }),
      this.prisma.level.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          progress: {
            where: { status: 'COMPLETED' },
            select: { stars: true, highScore: true, attempts: true },
          },
        },
      }),
    ])

    const levelsStats = levels.map((l) => {
      const completions = l.progress
      const totalAttempts = completions.reduce((s, p) => s + p.attempts, 0)
      const avgStars =
        completions.length > 0
          ? completions.reduce((s, p) => s + p.stars, 0) / completions.length
          : 0
      return {
        levelId: l.id,
        levelName: l.name,
        levelOrder: l.order,
        topic: l.topic,
        completionCount: completions.length,
        totalAttempts,
        avgStars: Math.round(avgStars * 10) / 10,
      }
    })

    return { totalStudents, totalCompletedSessions, levelsStats }
  }

  // ── Question bank ───────────────────────────────────────────────────────────

  async createQuestion(authorId: string, dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        type: dto.type,
        topic: dto.topic,
        stem: dto.stem,
        options: dto.options ?? undefined,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
        status: 'PENDING',
        authorId,
      },
      select: {
        id: true, type: true, topic: true, stem: true, difficulty: true,
        status: true, reviewNote: true, createdAt: true,
      },
    })
  }

  async getMyQuestions(authorId: string) {
    return this.prisma.question.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, topic: true, stem: true, options: true,
        correctAnswer: true, explanation: true, difficulty: true,
        status: true, reviewNote: true, createdAt: true,
      },
    })
  }

  async getBankQuestions() {
    return this.prisma.question.findMany({
      where: { status: 'APPROVED', isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, topic: true, stem: true, difficulty: true,
        options: true, correctAnswer: true, explanation: true,
        isActive: true, createdAt: true, authorId: true,
        author: { select: { username: true, profile: { select: { displayName: true } } } },
      },
    })
  }

  async updateQuestion(teacherId: string, id: string, dto: CreateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id } })
    if (!question) throw new NotFoundException('Pregunta no encontrada')
    if (question.authorId !== teacherId) {
      throw new ForbiddenException('Solo puedes editar tus propias preguntas')
    }
    return this.prisma.question.update({
      where: { id },
      data: {
        type: dto.type,
        topic: dto.topic,
        stem: dto.stem,
        options: dto.options ?? undefined,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
      },
      select: {
        id: true, type: true, topic: true, stem: true, difficulty: true,
        options: true, correctAnswer: true, explanation: true,
        isActive: true, createdAt: true, authorId: true,
        author: { select: { username: true, profile: { select: { displayName: true } } } },
      },
    })
  }

  async getQuestionStats() {
    const [questions, answers] = await Promise.all([
      this.prisma.question.findMany({
        where: { isActive: true },
        select: {
          id: true, stem: true, topic: true, difficulty: true, type: true,
          status: true, isGenerated: true,
          author: { select: { username: true, profile: { select: { displayName: true } } } },
        },
      }),
      this.prisma.sessionAnswer.findMany({
        select: { questionId: true, isCorrect: true, timeSpent: true },
      }),
    ])

    const statsMap = new Map<string, { total: number; correct: number; timeSum: number }>()
    for (const a of answers) {
      const existing = statsMap.get(a.questionId) ?? { total: 0, correct: 0, timeSum: 0 }
      existing.total++
      if (a.isCorrect) existing.correct++
      existing.timeSum += a.timeSpent
      statsMap.set(a.questionId, existing)
    }

    return questions
      .map((q) => {
        const s = statsMap.get(q.id) ?? { total: 0, correct: 0, timeSum: 0 }
        const errorRate = s.total > 0 ? Math.round(((s.total - s.correct) / s.total) * 100) : null
        const avgTime = s.total > 0 ? Math.round(s.timeSum / s.total) : null
        return { ...q, totalAttempts: s.total, correctCount: s.correct, errorRate, avgTime }
      })
      .sort((a, b) => (b.errorRate ?? -1) - (a.errorRate ?? -1))
  }

  // ── CSV report ──────────────────────────────────────────────────────────────

  async getProgressReport(): Promise<string> {
    const [levels, students, allProgress] = await Promise.all([
      this.prisma.level.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      this.prisma.user.findMany({
        where: { role: 'STUDENT', isActive: true },
        select: {
          id: true, username: true, email: true, createdAt: true,
          profile: { select: { displayName: true, totalXp: true, totalCoins: true } },
          group: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.progress.findMany({
        where: { user: { role: 'STUDENT' } },
        select: {
          userId: true, levelId: true, status: true,
          stars: true, highScore: true, attempts: true, completedAt: true,
        },
      }),
    ])

    const progressMap = new Map<string, Map<string, (typeof allProgress)[0]>>()
    for (const p of allProgress) {
      if (!progressMap.has(p.userId)) progressMap.set(p.userId, new Map())
      progressMap.get(p.userId)!.set(p.levelId, p)
    }

    const STATUS_LABELS: Record<string, string> = {
      COMPLETED: 'Completado', IN_PROGRESS: 'En progreso', LOCKED: 'Bloqueado',
    }

    const levelHeaders = levels.flatMap((l) => [
      `${l.name} — Estado`, `${l.name} — Estrellas`,
      `${l.name} — Mejor puntaje`, `${l.name} — Intentos`,
    ])
    const header = ['Nombre', 'Grupo', 'Email', 'XP Total', 'Monedas', 'Registrado', ...levelHeaders]
    const rows: string[] = [header.map(cell).join(',')]

    for (const student of students) {
      const name = student.profile?.displayName ?? student.username
      const xp = student.profile?.totalXp ?? 0
      const coins = student.profile?.totalCoins ?? 0
      const registered = student.createdAt.toISOString().slice(0, 10)
      const groupName = student.group?.name ?? 'Sin grupo'
      const studentMap = progressMap.get(student.id)
      const levelCells = levels.flatMap((l) => {
        const p = studentMap?.get(l.id)
        return [
          cell(p ? (STATUS_LABELS[p.status] ?? p.status) : 'Sin iniciar'),
          String(p?.stars ?? 0), String(p?.highScore ?? 0), String(p?.attempts ?? 0),
        ]
      })
      rows.push([cell(name), cell(groupName), cell(student.email), String(xp), String(coins), registered, ...levelCells].join(','))
    }

    return rows.join('\r\n')
  }
}
