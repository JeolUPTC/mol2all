import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

const STUDENT_NAMES = [
  // Grupo A
  ['Carlos',    'López'],       ['María',     'García'],
  ['Juan',      'Martínez'],    ['Ana',       'Rodríguez'],
  ['Pedro',     'Hernández'],   ['Laura',     'Pérez'],
  ['Diego',     'Sánchez'],     ['Sofía',     'Ramírez'],
  ['Andrés',    'Torres'],      ['Valentina', 'Flores'],
  // Grupo B
  ['Santiago',  'Morales'],     ['Camila',    'Jiménez'],
  ['Mateo',     'Vargas'],      ['Isabella',  'Castro'],
  ['Sebastián', 'Ramos'],       ['Gabriela',  'Herrera'],
  ['Felipe',    'Mendoza'],     ['Daniela',   'Cruz'],
  ['Tomás',     'Reyes'],       ['Valeria',   'Ortega'],
  // Grupo C
  ['Nicolás',   'Gutiérrez'],   ['Lucía',     'Moreno'],
  ['Alejandro', 'Rojas'],       ['Mariana',   'Navarro'],
  ['Ricardo',   'Delgado'],     ['Natalia',   'Vega'],
  ['Eduardo',   'Ríos'],        ['Paola',     'Cabrera'],
  ['Francisco', 'Aguilar'],     ['Catalina',  'Medina'],
  // Grupo D
  ['Emilio',    'Suárez'],      ['Regina',    'Fuentes'],
  ['Germán',    'Paredes'],     ['Fernanda',  'Espinoza'],
  ['Cristóbal', 'Ibáñez'],      ['Renata',    'Salinas'],
  ['Héctor',    'Miranda'],     ['Andrea',    'Acosta'],
  ['Mauricio',  'Serrano'],     ['Claudia',   'Peña'],
]

const GROUP_LABELS = ['a', 'b', 'c', 'd']

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reset ──────────────────────────────────────────────────────────────────

  async reset(): Promise<{ message: string; details: string[] }> {
    const details: string[] = []

    // 1. Borrar game sessions (cascade a session_answers)
    const { count: sessions } = await this.prisma.gameSession.deleteMany()
    details.push(`${sessions} sesiones de juego eliminadas`)

    // 2. Borrar logros de usuarios
    const { count: ach } = await this.prisma.userAchievement.deleteMany()
    details.push(`${ach} logros de usuario eliminados`)

    // 3. Borrar progreso
    const { count: prog } = await this.prisma.progress.deleteMany()
    details.push(`${prog} registros de progreso eliminados`)

    // 4. Quitar preguntas de docentes de los niveles y luego borrarlas
    await this.prisma.levelQuestion.deleteMany({
      where: { question: { authorId: { not: null } } },
    })
    const { count: qs } = await this.prisma.question.deleteMany({
      where: { authorId: { not: null } },
    })
    details.push(`${qs} preguntas de docentes eliminadas`)

    // 5. Limpiar FK de grupo en usuarios no-admin
    await this.prisma.user.updateMany({
      where: { email: { not: 'admin@mol2all.com' } },
      data: { groupId: null },
    })

    // 6. Borrar grupos
    const { count: grps } = await this.prisma.group.deleteMany()
    details.push(`${grps} grupos eliminados`)

    // 7. Borrar usuarios no-admin (perfil en cascade)
    const { count: users } = await this.prisma.user.deleteMany({
      where: { email: { not: 'admin@mol2all.com' } },
    })
    details.push(`${users} usuarios eliminados`)

    return {
      message: 'Sistema reiniciado correctamente.',
      details,
    }
  }

  // ── Demo ───────────────────────────────────────────────────────────────────

  async seedDemo(): Promise<{ message: string; details: string[] }> {
    await this.reset()

    const pw = await bcrypt.hash('Demo1234', SALT_ROUNDS)
    const details: string[] = []

    // Docentes
    const teachers = await Promise.all([
      this.createUser('ana@mol2all.com',    'ana_martinez',    'Prof. Ana Martínez',    'TEACHER', pw),
      this.createUser('luis@mol2all.com',   'luis_rodriguez',  'Prof. Luis Rodríguez',  'TEACHER', pw),
      this.createUser('carmen@mol2all.com', 'carmen_vega',     'Prof. Carmen Vega',     'TEACHER', pw),
    ])
    details.push('3 docentes creados (contraseña: Demo1234)')

    // Grupos
    const groups = await Promise.all([
      this.prisma.group.create({ data: { name: 'Grupo Química A',            description: '2025-I',  teacherId: teachers[0].id } }),
      this.prisma.group.create({ data: { name: 'Grupo Química B',            description: '2025-II', teacherId: teachers[0].id } }),
      this.prisma.group.create({ data: { name: 'Grupo Física-Química',       description: '2025-I',  teacherId: teachers[1].id } }),
      this.prisma.group.create({ data: { name: 'Grupo Ciencias Integradas',  description: '2025-I',  teacherId: teachers[2].id } }),
    ])
    details.push('4 grupos creados (2 para Prof. Ana, 1 para cada uno de los otros)')

    // Niveles (necesarios para el progreso)
    const levels = await this.prisma.level.findMany({ orderBy: { order: 'asc' } })

    // Estudiantes — 10 por grupo
    let totalStudents = 0
    for (let g = 0; g < groups.length; g++) {
      for (let s = 0; s < 10; s++) {
        const [first, last] = STUDENT_NAMES[g * 10 + s]
        const label = GROUP_LABELS[g]
        const username = `est_${label}${String(s + 1).padStart(2, '0')}`
        const student = await this.createUser(
          `${username}@mol2all.com`,
          username,
          `${first} ${last}`,
          'STUDENT',
          pw,
          groups[g].id,
        )
        await this.seedStudentProgress(student.id, levels)
        totalStudents++
      }
    }
    details.push(`${totalStudents} estudiantes creados con progreso aleatorio`)

    // Preguntas de docentes
    const qCount = await this.createTeacherQuestions(teachers.map((t) => t.id))
    details.push(`${qCount} preguntas de docentes creadas (2 aprobadas, 2 pendientes, 1 rechazada, 1 aprobada)`)

    return { message: 'Datos demo cargados correctamente.', details }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async createUser(
    email: string,
    username: string,
    displayName: string,
    role: 'TEACHER' | 'STUDENT',
    password: string,
    groupId?: string,
  ) {
    return this.prisma.user.create({
      data: {
        email, username, password, role,
        groupId: groupId ?? null,
        profile: { create: { displayName } },
      },
    })
  }

  private async seedStudentProgress(
    userId: string,
    levels: { id: string; xpReward: number; coinsReward: number }[],
  ) {
    const maxLevels = Math.floor(Math.random() * (levels.length + 1)) // 0..N
    if (maxLevels === 0) return

    let totalXp = 0
    let totalCoins = 0

    for (const level of levels.slice(0, maxLevels)) {
      const stars    = Math.floor(Math.random() * 3) + 1
      const attempts = Math.floor(Math.random() * 4) + 1
      const highScore = 150 + Math.floor(Math.random() * 350)
      const daysAgo  = Math.floor(Math.random() * 45) + 1

      await this.prisma.progress.create({
        data: {
          userId, levelId: level.id,
          status: 'COMPLETED', stars, highScore, attempts,
          completedAt: new Date(Date.now() - daysAgo * 86_400_000),
        },
      })

      totalXp    += Math.round(level.xpReward    * (stars / 3))
      totalCoins += Math.round(level.coinsReward * (stars / 3))
    }

    await this.prisma.profile.update({
      where: { userId },
      data: { totalXp, totalCoins },
    })
  }

  private async createTeacherQuestions(teacherIds: string[]): Promise<number> {
    const [ana, luis, carmen] = teacherIds

    const questions = [
      // ── Ana: 2 aprobadas + 1 pendiente ──────────────────────────────────────
      {
        type: 'MULTIPLE_CHOICE' as const,
        topic: 'molar_mass',
        stem: '¿Cuál es la masa molar del NaOH? (Na=23, O=16, H=1)',
        options: [
          { id: 'a', text: '40 g/mol' }, { id: 'b', text: '38 g/mol' },
          { id: 'c', text: '42 g/mol' }, { id: 'd', text: '36 g/mol' },
        ],
        correctAnswer: { id: 'a' },
        explanation: 'Na=23 + O=16 + H=1 = 40 g/mol',
        difficulty: 1, status: 'APPROVED' as const, authorId: ana,
      },
      {
        type: 'NUMERIC_INPUT' as const,
        topic: 'stoichiometry',
        stem: '¿Cuántos moles hay en 88 g de CO₂? (M=44 g/mol)',
        correctAnswer: { value: 2, tolerance: 0.1 },
        explanation: '88 g ÷ 44 g/mol = 2 mol',
        difficulty: 2, status: 'APPROVED' as const, authorId: ana,
      },
      {
        type: 'MULTIPLE_CHOICE' as const,
        topic: 'balancing',
        stem: '¿Cuántos moles de O₂ se consumen al quemar 2 mol de C₃H₈? (C₃H₈ + 5O₂ → 3CO₂ + 4H₂O)',
        options: [
          { id: 'a', text: '10 mol' }, { id: 'b', text: '5 mol' },
          { id: 'c', text: '8 mol' },  { id: 'd', text: '6 mol' },
        ],
        correctAnswer: { id: 'a' },
        explanation: '2 mol C₃H₈ × 5 mol O₂/mol = 10 mol O₂',
        difficulty: 3, status: 'PENDING' as const, authorId: ana,
      },
      // ── Luis: 1 aprobada + 1 rechazada ──────────────────────────────────────
      {
        type: 'MULTIPLE_CHOICE' as const,
        topic: 'limiting_reagent',
        stem: 'Con 1 mol de N₂ y 2 mol de H₂ en N₂ + 3H₂ → 2NH₃, ¿cuál es el reactivo límite?',
        options: [
          { id: 'a', text: 'H₂' }, { id: 'b', text: 'N₂' },
          { id: 'c', text: 'NH₃' }, { id: 'd', text: 'Ninguno' },
        ],
        correctAnswer: { id: 'a' },
        explanation: '1 mol N₂ requiere 3 mol H₂; solo hay 2 mol → H₂ es el límite.',
        difficulty: 2, status: 'APPROVED' as const, authorId: luis,
      },
      {
        type: 'NUMERIC_INPUT' as const,
        topic: 'yield',
        stem: 'Si el rendimiento teórico es 80 g y el real es 56 g, ¿cuál es el % de rendimiento?',
        correctAnswer: { value: 70, tolerance: 0.5 },
        explanation: '(56/80) × 100 = 70%',
        difficulty: 2,
        status: 'REJECTED' as const,
        reviewNote: 'El enunciado es ambiguo — especificar las condiciones de reacción.',
        authorId: luis,
      },
      // ── Carmen: 1 pendiente ──────────────────────────────────────────────────
      {
        type: 'MULTIPLE_CHOICE' as const,
        topic: 'molar_mass',
        stem: '¿Cuál es la masa molar del CaCO₃? (Ca=40, C=12, O=16)',
        options: [
          { id: 'a', text: '100 g/mol' }, { id: 'b', text: '84 g/mol' },
          { id: 'c', text: '96 g/mol' },  { id: 'd', text: '108 g/mol' },
        ],
        correctAnswer: { id: 'a' },
        explanation: 'Ca=40 + C=12 + 3×O=48 = 100 g/mol',
        difficulty: 1, status: 'PENDING' as const, authorId: carmen,
      },
    ]

    for (const q of questions) {
      await this.prisma.question.create({ data: q })
    }

    return questions.length
  }
}
