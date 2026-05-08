import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { ApiResponse } from '@core/types/api.types'

export interface QuestionOption {
  id: string
  text: string
  latex?: string
}

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'NUMERIC_INPUT'
  | 'EQUATION_BALANCE'
  | 'MATCH_PAIRS'

export interface GameQuestion {
  type: QuestionType
  topic: string
  stem: string
  latexFormula: string | null
  options: QuestionOption[] | null
  correctAnswer: unknown
  explanation: string
  difficulty: number
}

export type LevelTopic =
  | 'molar_mass'
  | 'balancing'
  | 'stoichiometry'
  | 'limiting_reagent'
  | 'yield'
  | 'mixed'

export const questionsService = {
  async generate(topic: LevelTopic, difficulty: 1 | 2 | 3): Promise<GameQuestion> {
    const { data } = await apiClient.get<ApiResponse<GameQuestion>>(
      `${ENDPOINTS.levels.list.replace('/levels', '')}/questions/generate`,
      { params: { topic, difficulty } },
    )
    return data.data
  },

  async generateBatch(
    topic: LevelTopic,
    difficulty: 1 | 2 | 3,
    count = 5,
  ): Promise<GameQuestion[]> {
    const { data } = await apiClient.get<ApiResponse<GameQuestion[]>>(
      '/questions/batch',
      { params: { topic, difficulty, count } },
    )
    return data.data
  },

  async generateMixed(count: number): Promise<GameQuestion[]> {
    const topics = ['molar_mass', 'balancing', 'stoichiometry', 'limiting_reagent', 'yield'] as const
    const batches = await Promise.all(topics.map(t => this.generateBatch(t, 3, 1)))
    const all = batches.flat()
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    return all.slice(0, count)
  },

  validateMultipleChoice(answer: { id: string }, correctAnswer: { id: string }): boolean {
    return answer.id === correctAnswer.id
  },

  validateNumeric(
    submitted: number,
    correctAnswer: { value: number; tolerance: number },
  ): boolean {
    return Math.abs(submitted - correctAnswer.value) <= correctAnswer.tolerance
  },
}
