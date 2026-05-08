import { PrismaClient, QuestionType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function seedLevelQuestions(
  levelOrder: number,
  questions: Array<{
    type: QuestionType
    topic: string
    stem: string
    latexFormula?: string
    options?: object
    correctAnswer: object
    explanation: string
    difficulty: number
  }>,
) {
  const level = await prisma.level.findUnique({ where: { order: levelOrder } })
  if (!level) return

  const existing = await prisma.levelQuestion.count({ where: { levelId: level.id } })
  if (existing > 0) return

  for (let i = 0; i < questions.length; i++) {
    const q = await prisma.question.create({ data: questions[i] })
    await prisma.levelQuestion.create({
      data: { levelId: level.id, questionId: q.id, order: i + 1 },
    })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Ejecutando seed de MOL2ALL...')

  // ── Usuarios ──────────────────────────────────────────────────
  const [adminPwd, teacherPwd, student1Pwd, student2Pwd] = await Promise.all([
    bcrypt.hash('admin1234', 12),
    bcrypt.hash('teacher1234', 12),
    bcrypt.hash('student1234', 12),
    bcrypt.hash('student1234', 12),
  ])

  await prisma.user.upsert({
    where: { email: 'admin@mol2all.com' },
    update: {},
    create: {
      email: 'admin@mol2all.com',
      username: 'admin',
      password: adminPwd,
      role: 'ADMIN',
      profile: { create: { displayName: 'Administrador' } },
    },
  })

  await prisma.user.upsert({
    where: { email: 'docente@mol2all.com' },
    update: {},
    create: {
      email: 'docente@mol2all.com',
      username: 'docente_demo',
      password: teacherPwd,
      role: 'TEACHER',
      profile: { create: { displayName: 'Prof. García' } },
    },
  })

  const student1 = await prisma.user.upsert({
    where: { email: 'estudiante@mol2all.com' },
    update: {},
    create: {
      email: 'estudiante@mol2all.com',
      username: 'estudiante_demo',
      password: student1Pwd,
      role: 'STUDENT',
      profile: { create: { displayName: 'Carlos López', totalXp: 250, totalCoins: 125 } },
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'maria@mol2all.com' },
    update: {},
    create: {
      email: 'maria@mol2all.com',
      username: 'maria_torres',
      password: student2Pwd,
      role: 'STUDENT',
      profile: { create: { displayName: 'María Torres', totalXp: 550, totalCoins: 275 } },
    },
  })

  // ── Niveles ───────────────────────────────────────────────────
  const levelDefs = [
    {
      order: 1,
      name: 'Introducción a la Masa Molar',
      description: 'Aprende a calcular la masa molar de compuestos simples',
      topic: 'molar_mass',
      difficulty: 1,
      xpReward: 100,
      coinsReward: 50,
    },
    {
      order: 2,
      name: 'Balanceo de Ecuaciones I',
      description: 'Balancea ecuaciones químicas simples usando el método de inspección',
      topic: 'balancing',
      difficulty: 2,
      xpReward: 150,
      coinsReward: 75,
    },
    {
      order: 3,
      name: 'Estequiometría Básica',
      description: 'Calcula cantidades de reactivos y productos en reacciones',
      topic: 'stoichiometry',
      difficulty: 2,
      xpReward: 200,
      coinsReward: 100,
    },
    {
      order: 4,
      name: 'Reactivo Límite',
      description: 'Identifica el reactivo límite y calcula el exceso',
      topic: 'limiting_reagent',
      difficulty: 3,
      xpReward: 250,
      coinsReward: 125,
    },
    {
      order: 5,
      name: 'Rendimiento Porcentual',
      description: 'Calcula el rendimiento real de una reacción química',
      topic: 'yield',
      difficulty: 3,
      xpReward: 300,
      coinsReward: 150,
    },
    {
      order: 6,
      name: 'Maestro Químico',
      description: 'Desafío final: preguntas de todos los temas combinados',
      topic: 'mixed',
      difficulty: 3,
      xpReward: 500,
      coinsReward: 250,
    },
  ]

  for (const def of levelDefs) {
    await prisma.level.upsert({ where: { order: def.order }, update: {}, create: def })
  }

  // ── Preguntas Nivel 1 — Masa Molar ────────────────────────────
  await seedLevelQuestions(1, [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'molar_mass',
      stem: '¿Cuál es la masa molar del agua (H₂O)?',
      latexFormula: 'H_2O',
      options: [
        { id: 'a', text: '18 g/mol' },
        { id: 'b', text: '16 g/mol' },
        { id: 'c', text: '20 g/mol' },
        { id: 'd', text: '10 g/mol' },
      ],
      correctAnswer: { id: 'a' },
      explanation: 'H = 1 g/mol × 2 = 2 g/mol; O = 16 g/mol. Total = 18 g/mol',
      difficulty: 1,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'molar_mass',
      stem: '¿Cuál es la masa molar del CO₂?',
      latexFormula: 'CO_2',
      options: [
        { id: 'a', text: '44 g/mol' },
        { id: 'b', text: '28 g/mol' },
        { id: 'c', text: '32 g/mol' },
        { id: 'd', text: '56 g/mol' },
      ],
      correctAnswer: { id: 'a' },
      explanation: 'C = 12 g/mol; O = 16 g/mol × 2 = 32 g/mol. Total = 44 g/mol',
      difficulty: 1,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'molar_mass',
      stem: 'Calcula la masa molar del NaCl en g/mol. (Na=22.99, Cl=35.45)',
      latexFormula: 'NaCl',
      correctAnswer: { value: 58.44, tolerance: 0.5 },
      explanation: 'Na = 22.99 g/mol; Cl = 35.45 g/mol. Total = 58.44 g/mol',
      difficulty: 1,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'molar_mass',
      stem: '¿Cuántos gramos hay en 2 moles de H₂O?',
      latexFormula: '2 \\text{ mol} \\times 18 \\text{ g/mol}',
      options: [
        { id: 'a', text: '36 g' },
        { id: 'b', text: '18 g' },
        { id: 'c', text: '9 g' },
        { id: 'd', text: '40 g' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '2 mol × 18 g/mol = 36 g',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'molar_mass',
      stem: '¿Cuántos moles hay en 44 g de CO₂? (M = 44 g/mol)',
      options: [
        { id: 'a', text: '1 mol' },
        { id: 'b', text: '2 mol' },
        { id: 'c', text: '0.5 mol' },
        { id: 'd', text: '44 mol' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '44 g ÷ 44 g/mol = 1 mol',
      difficulty: 2,
    },
  ])

  // ── Preguntas Nivel 2 — Balanceo ──────────────────────────────
  await seedLevelQuestions(2, [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'balancing',
      stem: '¿Cuál es la ecuación balanceada para la formación de agua?',
      latexFormula: 'H_2 + O_2 \\rightarrow H_2O',
      options: [
        { id: 'a', text: '2H₂ + O₂ → 2H₂O' },
        { id: 'b', text: 'H₂ + O₂ → H₂O' },
        { id: 'c', text: 'H₂ + 2O₂ → 2H₂O' },
        { id: 'd', text: '2H₂ + 2O₂ → H₂O' },
      ],
      correctAnswer: { id: 'a' },
      explanation: 'Se necesitan 2 mol de H₂ y 1 mol de O₂ para formar 2 mol de H₂O. Verifica: H: 4=4, O: 2=2.',
      difficulty: 1,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'balancing',
      stem: 'En N₂ + H₂ → NH₃, ¿cuántos moles de H₂ se necesitan para balancear?',
      latexFormula: 'N_2 + ? H_2 \\rightarrow 2NH_3',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '2' },
        { id: 'c', text: '4' },
        { id: 'd', text: '1' },
      ],
      correctAnswer: { id: 'a' },
      explanation: 'Ecuación balanceada: N₂ + 3H₂ → 2NH₃. H: 6=6, N: 2=2.',
      difficulty: 2,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'balancing',
      stem: 'En CH₄ + O₂ → CO₂ + H₂O, ¿cuál es el coeficiente del O₂ en la ecuación balanceada?',
      latexFormula: 'CH_4 + ? O_2 \\rightarrow CO_2 + 2H_2O',
      correctAnswer: { value: 2, tolerance: 0 },
      explanation: 'CH₄ + 2O₂ → CO₂ + 2H₂O. O: 4=4, H: 4=4, C: 1=1.',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'balancing',
      stem: 'Al balancear 4Fe + 3O₂ → 2Fe₂O₃, ¿qué coeficiente tiene el O₂?',
      latexFormula: '4Fe + ?O_2 \\rightarrow 2Fe_2O_3',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '2' },
        { id: 'c', text: '4' },
        { id: 'd', text: '6' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '4Fe + 3O₂ → 2Fe₂O₃. Fe: 4=4, O: 6=6.',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'balancing',
      stem: '¿Cuál es la ecuación balanceada de Al + HCl → AlCl₃ + H₂?',
      latexFormula: 'Al + HCl \\rightarrow AlCl_3 + H_2',
      options: [
        { id: 'a', text: '2Al + 6HCl → 2AlCl₃ + 3H₂' },
        { id: 'b', text: 'Al + 3HCl → AlCl₃ + H₂' },
        { id: 'c', text: 'Al + HCl → AlCl₃ + H₂' },
        { id: 'd', text: '2Al + 3HCl → 2AlCl₃ + H₂' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '2Al + 6HCl → 2AlCl₃ + 3H₂. Al: 2=2, Cl: 6=6, H: 6=6.',
      difficulty: 3,
    },
  ])

  // ── Preguntas Nivel 3 — Estequiometría ────────────────────────
  await seedLevelQuestions(3, [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'stoichiometry',
      stem: 'En N₂ + 3H₂ → 2NH₃, ¿cuántos moles de NH₃ se producen a partir de 2 mol de N₂?',
      latexFormula: 'N_2 + 3H_2 \\rightarrow 2NH_3',
      options: [
        { id: 'a', text: '4 mol' },
        { id: 'b', text: '2 mol' },
        { id: 'c', text: '6 mol' },
        { id: 'd', text: '1 mol' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '2 mol N₂ × (2 mol NH₃ / 1 mol N₂) = 4 mol NH₃',
      difficulty: 2,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'stoichiometry',
      stem: 'Al quemar 4 g de H₂ (M=2 g/mol), ¿cuántos gramos de H₂O (M=18 g/mol) se producen? (2H₂ + O₂ → 2H₂O)',
      latexFormula: '2H_2 + O_2 \\rightarrow 2H_2O',
      correctAnswer: { value: 36, tolerance: 1 },
      explanation: '4 g H₂ ÷ 2 g/mol = 2 mol H₂ → 2 mol H₂O = 2 × 18 g = 36 g',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'stoichiometry',
      stem: 'En 2H₂ + O₂ → 2H₂O, ¿cuántos mol de O₂ se necesitan para producir 4 mol de H₂O?',
      latexFormula: '2H_2 + O_2 \\rightarrow 2H_2O',
      options: [
        { id: 'a', text: '2 mol' },
        { id: 'b', text: '4 mol' },
        { id: 'c', text: '1 mol' },
        { id: 'd', text: '8 mol' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '4 mol H₂O × (1 mol O₂ / 2 mol H₂O) = 2 mol O₂',
      difficulty: 2,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'stoichiometry',
      stem: 'Al quemar 1 mol de CH₄, ¿cuántos gramos de CO₂ (M=44 g/mol) se producen? (CH₄ + 2O₂ → CO₂ + 2H₂O)',
      latexFormula: 'CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O',
      correctAnswer: { value: 44, tolerance: 0 },
      explanation: '1 mol CH₄ → 1 mol CO₂ = 1 × 44 g/mol = 44 g',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'stoichiometry',
      stem: 'En N₂ + 3H₂ → 2NH₃, ¿cuántos moles de NH₃ se obtienen de 6 mol de H₂?',
      latexFormula: 'N_2 + 3H_2 \\rightarrow 2NH_3',
      options: [
        { id: 'a', text: '4 mol' },
        { id: 'b', text: '6 mol' },
        { id: 'c', text: '3 mol' },
        { id: 'd', text: '2 mol' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '6 mol H₂ × (2 mol NH₃ / 3 mol H₂) = 4 mol NH₃',
      difficulty: 3,
    },
  ])

  // ── Preguntas Nivel 4 — Reactivo Límite ───────────────────────
  await seedLevelQuestions(4, [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'limiting_reagent',
      stem: 'Se mezclan 3 mol de N₂ y 6 mol de H₂. (N₂ + 3H₂ → 2NH₃) ¿Cuál es el reactivo límite?',
      latexFormula: 'N_2 + 3H_2 \\rightarrow 2NH_3',
      options: [
        { id: 'a', text: 'H₂' },
        { id: 'b', text: 'N₂' },
        { id: 'c', text: 'NH₃' },
        { id: 'd', text: 'Ninguno, están en proporción exacta' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '3 mol N₂ necesitan 9 mol H₂, pero solo hay 6. El H₂ se agota primero → es el reactivo límite.',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'limiting_reagent',
      stem: 'Se tienen 4 mol de H₂ y 3 mol de O₂. (2H₂ + O₂ → 2H₂O) ¿Cuál es el reactivo límite?',
      latexFormula: '2H_2 + O_2 \\rightarrow 2H_2O',
      options: [
        { id: 'a', text: 'H₂' },
        { id: 'b', text: 'O₂' },
        { id: 'c', text: 'H₂O' },
        { id: 'd', text: 'Ambos se agotan igual' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '4 mol H₂ necesitan solo 2 mol O₂. Hay 3 mol O₂ disponibles, así que el H₂ es el reactivo límite.',
      difficulty: 2,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'limiting_reagent',
      stem: 'Con 4 mol de H₂ como reactivo límite en 2H₂ + O₂ → 2H₂O, ¿cuántos mol de H₂O se producen?',
      latexFormula: '2H_2 + O_2 \\rightarrow 2H_2O',
      correctAnswer: { value: 4, tolerance: 0 },
      explanation: '4 mol H₂ × (2 mol H₂O / 2 mol H₂) = 4 mol H₂O',
      difficulty: 3,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'limiting_reagent',
      stem: 'Se tienen 2 mol de Al y 2 mol de Cl₂. (2Al + 3Cl₂ → 2AlCl₃) ¿Cuál es el reactivo límite?',
      latexFormula: '2Al + 3Cl_2 \\rightarrow 2AlCl_3',
      options: [
        { id: 'a', text: 'Cl₂' },
        { id: 'b', text: 'Al' },
        { id: 'c', text: 'AlCl₃' },
        { id: 'd', text: 'Ninguno' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '2 mol Al necesitan 3 mol Cl₂, pero solo hay 2 mol. El Cl₂ es el reactivo límite.',
      difficulty: 3,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'limiting_reagent',
      stem: 'Se tienen 3 mol de Fe y 2 mol de S. (Fe + S → FeS) ¿Cuántos mol de FeS se producen?',
      latexFormula: 'Fe + S \\rightarrow FeS',
      correctAnswer: { value: 2, tolerance: 0 },
      explanation: 'La relación es 1:1. Solo hay 2 mol de S (reactivo límite), así que se producen 2 mol de FeS.',
      difficulty: 3,
    },
  ])

  // ── Preguntas Nivel 5 — Rendimiento Porcentual ────────────────
  await seedLevelQuestions(5, [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'yield',
      stem: 'El rendimiento teórico es 40 g y se obtuvieron 32 g. ¿Cuál es el rendimiento porcentual?',
      latexFormula: '\\%R = \\frac{\\text{real}}{\\text{teórico}} \\times 100',
      options: [
        { id: 'a', text: '80 %' },
        { id: 'b', text: '75 %' },
        { id: 'c', text: '85 %' },
        { id: 'd', text: '90 %' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '(32 g / 40 g) × 100 = 80 %',
      difficulty: 2,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'yield',
      stem: 'El rendimiento teórico es 50 g y el real es 45 g. ¿Cuál es el % de rendimiento?',
      latexFormula: '\\%R = \\frac{45}{50} \\times 100',
      correctAnswer: { value: 90, tolerance: 0.5 },
      explanation: '(45 / 50) × 100 = 90 %',
      difficulty: 2,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'yield',
      stem: '¿Qué significa un rendimiento del 100 %?',
      options: [
        { id: 'a', text: 'Se obtuvo toda la cantidad teórica esperada' },
        { id: 'b', text: 'Se obtuvo el doble de lo esperado' },
        { id: 'c', text: 'La reacción no ocurrió' },
        { id: 'd', text: 'Solo la mitad del producto fue obtenida' },
      ],
      correctAnswer: { id: 'a' },
      explanation: 'Un rendimiento del 100 % indica que la cantidad obtenida es igual a la cantidad teórica calculada.',
      difficulty: 1,
    },
    {
      type: QuestionType.NUMERIC_INPUT,
      topic: 'yield',
      stem: 'El rendimiento es 75 % y se obtuvieron 30 g de producto. ¿Cuál fue el rendimiento teórico en gramos?',
      latexFormula: '\\text{teórico} = \\frac{\\text{real}}{\\%R} \\times 100',
      correctAnswer: { value: 40, tolerance: 0.5 },
      explanation: 'teórico = 30 g / 0.75 = 40 g',
      difficulty: 3,
    },
    {
      type: QuestionType.MULTIPLE_CHOICE,
      topic: 'yield',
      stem: 'Se producen 18 g de agua; el teórico era 24 g. ¿Cuál es el % de rendimiento?',
      latexFormula: '\\%R = \\frac{18}{24} \\times 100',
      options: [
        { id: 'a', text: '75 %' },
        { id: 'b', text: '80 %' },
        { id: 'c', text: '60 %' },
        { id: 'd', text: '70 %' },
      ],
      correctAnswer: { id: 'a' },
      explanation: '(18 / 24) × 100 = 75 %',
      difficulty: 2,
    },
  ])

  // ── Logros ────────────────────────────────────────────────────
  const achievements = [
    {
      code: 'first_level',
      name: 'Primer Paso',
      description: 'Completa tu primer nivel',
      xpReward: 50,
      condition: { type: 'level_complete', value: 1 },
    },
    {
      code: 'three_levels',
      name: 'En Racha',
      description: 'Completa 3 niveles distintos',
      xpReward: 100,
      condition: { type: 'level_complete', value: 3 },
    },
    {
      code: 'all_levels',
      name: 'Gran Químico',
      description: 'Completa todos los niveles de la plataforma',
      xpReward: 300,
      condition: { type: 'level_complete', value: 5 },
    },
    {
      code: 'perfect_score',
      name: 'Perfección Química',
      description: 'Obtén 3 estrellas en cualquier nivel',
      xpReward: 100,
      condition: { type: 'stars', value: 3 },
    },
    {
      code: 'mol_master',
      name: 'Maestro del Mol',
      description: 'Completa el nivel de masa molar',
      xpReward: 150,
      condition: { type: 'topic_complete', topic: 'molar_mass' },
    },
    {
      code: 'balance_master',
      name: 'Equilibrio Perfecto',
      description: 'Completa el nivel de balanceo de ecuaciones',
      xpReward: 150,
      condition: { type: 'topic_complete', topic: 'balancing' },
    },
    {
      code: 'stoich_master',
      name: 'Calculista Molecular',
      description: 'Completa el nivel de estequiometría básica',
      xpReward: 175,
      condition: { type: 'topic_complete', topic: 'stoichiometry' },
    },
    {
      code: 'limiting_master',
      name: 'Detector de Límites',
      description: 'Completa el nivel de reactivo límite',
      xpReward: 200,
      condition: { type: 'topic_complete', topic: 'limiting_reagent' },
    },
    {
      code: 'yield_master',
      name: 'Rendimiento Óptimo',
      description: 'Completa el nivel de rendimiento porcentual',
      xpReward: 250,
      condition: { type: 'topic_complete', topic: 'yield' },
    },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach,
    })
  }

  // ── Progreso demo (María Torres) ──────────────────────────────
  const [lvl1, lvl2] = await Promise.all([
    prisma.level.findUnique({ where: { order: 1 } }),
    prisma.level.findUnique({ where: { order: 2 } }),
  ])

  if (lvl1) {
    await prisma.progress.upsert({
      where: { userId_levelId: { userId: student2.id, levelId: lvl1.id } },
      update: {},
      create: {
        userId: student2.id,
        levelId: lvl1.id,
        status: 'COMPLETED',
        stars: 3,
        highScore: 480,
        attempts: 2,
        completedAt: new Date('2025-04-20'),
      },
    })
  }

  if (lvl2) {
    await prisma.progress.upsert({
      where: { userId_levelId: { userId: student2.id, levelId: lvl2.id } },
      update: {},
      create: {
        userId: student2.id,
        levelId: lvl2.id,
        status: 'COMPLETED',
        stars: 2,
        highScore: 320,
        attempts: 3,
        completedAt: new Date('2025-04-28'),
      },
    })
  }

  console.log('✅ Seed completado exitosamente')
  console.log('')
  console.log('   Usuarios demo:')
  console.log('   → admin@mol2all.com      / admin1234')
  console.log('   → docente@mol2all.com    / teacher1234')
  console.log('   → estudiante@mol2all.com / student1234')
  console.log('   → maria@mol2all.com      / student1234')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
