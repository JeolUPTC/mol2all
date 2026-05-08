export type LevelStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'
export type LevelTopic =
  | 'molar_mass'
  | 'balancing'
  | 'stoichiometry'
  | 'limiting_reagent'
  | 'yield'

export interface Level {
  id: string
  order: number
  name: string
  description: string | null
  topic: LevelTopic
  difficulty: number
  xpReward: number
  coinsReward: number
  isActive: boolean
}

export interface LevelWithProgress extends Level {
  progress: Progress | null
  isUnlocked: boolean
}

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'NUMERIC_INPUT'
  | 'EQUATION_BALANCE'
  | 'MATCH_PAIRS'

export interface QuestionOption {
  id: string
  text: string
  latex?: string
}

export interface Question {
  id: string
  type: QuestionType
  topic: string
  stem: string
  latexFormula: string | null
  options: QuestionOption[] | null
  difficulty: number
}

export interface Progress {
  id: string
  userId: string
  levelId: string
  status: LevelStatus
  stars: number
  highScore: number
  attempts: number
  completedAt: string | null
}

export interface GameSession {
  id: string
  userId: string
  levelId: string
  score: number
  lives: number
  energy: number
  timeSpent: number
  completed: boolean
  startedAt: string
  endedAt: string | null
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  iconUrl: string | null
  xpReward: number
}

export interface UserAchievement {
  userId: string
  achievementId: string
  unlockedAt: string
  achievement: Achievement
}
