import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

interface UpdateUserDto {
  isActive?: boolean
  role?: Role
}

interface UpdateLevelDto {
  name?: string
  description?: string
  xpReward?: number
  coinsReward?: number
  isActive?: boolean
}

interface CreateTeacherDto {
  email: string
  username: string
  displayName: string
  password: string
}

interface CreateGroupDto {
  name: string
  description?: string
  teacherId?: string
}

interface UpdateGroupDto {
  name?: string
  description?: string
  teacherId?: string | null
  isActive?: boolean
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalStudents, totalTeachers, totalAdmins, totalSessions, completedLevels, totalGroups] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'STUDENT' } }),
        this.prisma.user.count({ where: { role: 'TEACHER' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.gameSession.count({ where: { completed: true } }),
        this.prisma.progress.count({ where: { status: 'COMPLETED' } }),
        this.prisma.group.count({ where: { isActive: true } }),
      ])
    return { totalStudents, totalTeachers, totalAdmins, totalSessions, completedLevels, totalGroups }
  }

  async getAnalytics() {
    const [
      totalStudents, totalTeachers, totalGroups,
      approvedQ, pendingQ, rejectedQ,
      levels, allProgress, students, groups,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.group.count({ where: { isActive: true } }),
      this.prisma.question.count({ where: { status: 'APPROVED' } }),
      this.prisma.question.count({ where: { status: 'PENDING' } }),
      this.prisma.question.count({ where: { status: 'REJECTED' } }),
      this.prisma.level.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, order: true },
      }),
      this.prisma.progress.findMany({
        where: { status: 'COMPLETED', user: { role: 'STUDENT' } },
        select: { userId: true, levelId: true },
      }),
      this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          profile: { select: { displayName: true, totalXp: true } },
          group: { select: { name: true } },
        },
      }),
      this.prisma.group.findMany({
        where: { isActive: true },
        select: {
          name: true,
          students: { select: { profile: { select: { totalXp: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const studentLevelCount = new Map<string, number>()
    const levelCompletionMap = new Map<string, number>()
    for (const p of allProgress) {
      studentLevelCount.set(p.userId, (studentLevelCount.get(p.userId) ?? 0) + 1)
      levelCompletionMap.set(p.levelId, (levelCompletionMap.get(p.levelId) ?? 0) + 1)
    }

    const levelCompletion = levels.map((l) => {
      const completions = levelCompletionMap.get(l.id) ?? 0
      return {
        levelName: l.name,
        order: l.order,
        completions,
        pct: totalStudents > 0 ? Math.round((completions / totalStudents) * 100) : 0,
      }
    })

    const buckets = [0, 0, 0, 0]
    for (const s of students) {
      const n = studentLevelCount.get(s.id) ?? 0
      if (n === 0) buckets[0]++
      else if (n <= 2) buckets[1]++
      else if (n <= 4) buckets[2]++
      else buckets[3]++
    }

    const activeStudents = buckets[1] + buckets[2] + buckets[3]
    const activeStudentPct = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0

    const groupComparison = groups.map((g) => {
      const count = g.students.length
      const totalXp = g.students.reduce((s, u) => s + (u.profile?.totalXp ?? 0), 0)
      return { name: g.name, avgXp: count > 0 ? Math.round(totalXp / count) : 0, studentCount: count }
    })

    const topStudents = students
      .map((s) => ({
        displayName: s.profile?.displayName ?? 'Sin nombre',
        totalXp: s.profile?.totalXp ?? 0,
        levelsCompleted: studentLevelCount.get(s.id) ?? 0,
        groupName: s.group?.name ?? null,
      }))
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 5)

    return {
      kpis: { totalStudents, totalTeachers, totalGroups, completedLevels: allProgress.length, activeStudentPct },
      questionStatus: { approved: approvedQ, pending: pendingQ, rejected: rejectedQ },
      levelCompletion,
      groupComparison,
      progressDistribution: [
        { label: '0 niveles', count: buckets[0] },
        { label: '1–2 niveles', count: buckets[1] },
        { label: '3–4 niveles', count: buckets[2] },
        { label: '5+ niveles', count: buckets[3] },
      ],
      topStudents,
    }
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: { select: { displayName: true, totalXp: true } },
        group: { select: { id: true, name: true } },
        teacherGroups: { select: { id: true, name: true } },
        _count: { select: { progress: { where: { status: 'COMPLETED' } } } },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    })
  }

  async createTeacher(dto: CreateTeacherDto) {
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
        role: 'TEACHER',
        profile: { create: { displayName: dto.displayName } },
      },
      select: {
        id: true, email: true, username: true, role: true, isActive: true, createdAt: true,
        profile: { select: { displayName: true } },
      },
    })
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.prisma.user.findUniqueOrThrow({ where: { id } })
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, username: true, role: true, isActive: true },
    })
  }

  // ── Groups ──────────────────────────────────────────────────────────────────

  async getGroups() {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        teacher: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        _count: { select: { students: true } },
      },
    })
  }

  async createGroup(dto: CreateGroupDto) {
    if (dto.teacherId) {
      const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId } })
      if (!teacher || teacher.role !== 'TEACHER') {
        throw new NotFoundException('Docente no encontrado')
      }
    }
    return this.prisma.group.create({
      data: { name: dto.name, description: dto.description, teacherId: dto.teacherId },
      include: {
        teacher: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        _count: { select: { students: true } },
      },
    })
  }

  async updateGroup(id: string, dto: UpdateGroupDto) {
    await this.prisma.group.findUniqueOrThrow({ where: { id } })
    if (dto.teacherId) {
      const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId } })
      if (!teacher || teacher.role !== 'TEACHER') {
        throw new NotFoundException('Docente no encontrado')
      }
    }
    return this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.teacherId !== undefined && { teacherId: dto.teacherId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        teacher: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        _count: { select: { students: true } },
      },
    })
  }

  async getGroupStats() {
    const groups = await this.prisma.group.findMany({
      where: { isActive: true },
      include: {
        teacher: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        students: {
          select: {
            id: true,
            profile: { select: { totalXp: true } },
            _count: { select: { progress: { where: { status: 'COMPLETED' } } } },
          },
        },
      },
    })

    return groups.map((g) => {
      const count = g.students.length
      const totalXp = g.students.reduce((s, u) => s + (u.profile?.totalXp ?? 0), 0)
      const totalLevels = g.students.reduce((s, u) => s + u._count.progress, 0)
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        isActive: g.isActive,
        teacher: g.teacher,
        studentCount: count,
        avgXp: count > 0 ? Math.round(totalXp / count) : 0,
        avgLevels: count > 0 ? Math.round((totalLevels / count) * 10) / 10 : 0,
        totalXp,
      }
    })
  }

  async getGroupStudents(groupId: string) {
    await this.prisma.group.findUniqueOrThrow({ where: { id: groupId } })
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

  async assignStudentToGroup(groupId: string, studentId: string) {
    await this.prisma.group.findUniqueOrThrow({ where: { id: groupId } })
    const student = await this.prisma.user.findUnique({ where: { id: studentId } })
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Estudiante no encontrado')
    return this.prisma.user.update({
      where: { id: studentId },
      data: { groupId },
      select: { id: true, username: true, groupId: true },
    })
  }

  async removeStudentFromGroup(studentId: string) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } })
    if (!student) throw new NotFoundException('Estudiante no encontrado')
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

  async getTeachers() {
    return this.prisma.user.findMany({
      where: { role: 'TEACHER', isActive: true },
      select: {
        id: true, username: true,
        profile: { select: { displayName: true } },
        teacherGroups: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // ── Levels ──────────────────────────────────────────────────────────────────

  async getLevels() {
    return this.prisma.level.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { progress: { where: { status: 'COMPLETED' } } } },
      },
    })
  }

  async updateLevel(id: string, dto: UpdateLevelDto) {
    const level = await this.prisma.level.findUnique({ where: { id } })
    if (!level) throw new NotFoundException('Nivel no encontrado')
    return this.prisma.level.update({ where: { id }, data: dto })
  }

  // ── Question review ─────────────────────────────────────────────────────────

  async createQuestion(authorId: string, dto: {
    type: string; topic: string; difficulty: number; stem: string
    options?: { id: string; text: string }[]; correctAnswer: object; explanation: string
  }) {
    return this.prisma.question.create({
      data: {
        type: dto.type as any,
        topic: dto.topic,
        stem: dto.stem,
        options: dto.options ?? undefined,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
        status: 'APPROVED',
        isActive: true,
        authorId,
      },
      select: {
        id: true, type: true, topic: true, stem: true, difficulty: true,
        status: true, isActive: true, createdAt: true,
      },
    })
  }

  async getPendingQuestions() {
    return this.prisma.question.findMany({
      where: { status: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, topic: true, stem: true, options: true,
        correctAnswer: true, explanation: true, difficulty: true,
        status: true, reviewNote: true, createdAt: true,
        author: {
          select: { username: true, profile: { select: { displayName: true } } },
        },
      },
    })
  }

  async getApprovedQuestions() {
    return this.prisma.question.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, topic: true, stem: true, difficulty: true,
        options: true, correctAnswer: true, explanation: true,
        isActive: true, createdAt: true,
        author: {
          select: { username: true, profile: { select: { displayName: true } } },
        },
      },
    })
  }

  async updateQuestion(id: string, dto: {
    type: string; topic: string; difficulty: number; stem: string
    options?: { id: string; text: string }[]; correctAnswer: object; explanation: string
  }) {
    const question = await this.prisma.question.findUnique({ where: { id } })
    if (!question) throw new NotFoundException('Pregunta no encontrada')
    return this.prisma.question.update({
      where: { id },
      data: {
        type: dto.type as any,
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
        isActive: true, createdAt: true,
        author: { select: { username: true, profile: { select: { displayName: true } } } },
      },
    })
  }

  async reviewQuestion(id: string, dto: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }) {
    const question = await this.prisma.question.findUnique({ where: { id } })
    if (!question) throw new NotFoundException('Pregunta no encontrada')
    return this.prisma.question.update({
      where: { id },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote ?? null,
        isActive: dto.status === 'APPROVED',
      },
      select: { id: true, status: true, reviewNote: true, isActive: true },
    })
  }

  async toggleQuestionActive(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } })
    if (!question) throw new NotFoundException('Pregunta no encontrada')
    return this.prisma.question.update({
      where: { id },
      data: { isActive: !question.isActive },
      select: { id: true, isActive: true },
    })
  }
}
