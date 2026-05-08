import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  generateQuestion,
  generateBatch,
  validateAnswer,
  type GeneratedQuestion,
} from './engines/question-generator'

type Topic = 'molar_mass' | 'balancing' | 'stoichiometry' | 'limiting_reagent' | 'yield'
const VALID_TOPICS: Topic[] = ['molar_mass', 'balancing', 'stoichiometry', 'limiting_reagent', 'yield']

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Genera una pregunta procedural sin persistirla en DB */
  generate(topic: string, difficulty: number): GeneratedQuestion {
    this.assertValidTopic(topic)
    this.assertValidDifficulty(difficulty)
    return generateQuestion(topic as Topic, difficulty as 1 | 2 | 3)
  }

  /** Genera un lote de preguntas procedurales */
  generateBatch(topic: string, difficulty: number, count: number): GeneratedQuestion[] {
    this.assertValidTopic(topic)
    this.assertValidDifficulty(difficulty)
    const safeCount = Math.min(Math.max(count, 1), 20)
    return generateBatch(topic as Topic, difficulty as 1 | 2 | 3, safeCount)
  }

  /** Genera y persiste una pregunta en la DB (útil para banco de preguntas del docente) */
  async generateAndSave(topic: string, difficulty: number): Promise<unknown> {
    const q = this.generate(topic, difficulty)
    return this.prisma.question.create({
      data: {
        type: q.type,
        topic: q.topic,
        stem: q.stem,
        latexFormula: q.latexFormula,
        options: q.options as never,
        correctAnswer: q.correctAnswer as never,
        explanation: q.explanation,
        difficulty: q.difficulty,
        isGenerated: true,
      },
    })
  }

  /** Preguntas de la DB para un nivel específico */
  async findRandom(topic: string, difficulty: number, limit = 5) {
    const questions = await this.prisma.question.findMany({
      where: { topic, difficulty, isActive: true },
      select: {
        id: true,
        type: true,
        topic: true,
        stem: true,
        latexFormula: true,
        options: true,
        difficulty: true,
      },
    })
    return questions.sort(() => Math.random() - 0.5).slice(0, limit)
  }

  /** Valida la respuesta de un estudiante a una pregunta generada */
  checkAnswer(
    questionType: string,
    correctAnswer: unknown,
    submittedAnswer: unknown,
  ): { isCorrect: boolean } {
    const isCorrect = validateAnswer(
      questionType as Parameters<typeof validateAnswer>[0],
      correctAnswer,
      submittedAnswer,
    )
    return { isCorrect }
  }

  private assertValidTopic(topic: string) {
    if (!VALID_TOPICS.includes(topic as Topic)) {
      throw new BadRequestException(
        `Tema inválido. Valores permitidos: ${VALID_TOPICS.join(', ')}`,
      )
    }
  }

  private assertValidDifficulty(difficulty: number) {
    if (![1, 2, 3].includes(difficulty)) {
      throw new BadRequestException('Dificultad inválida. Valores permitidos: 1, 2, 3')
    }
  }
}
