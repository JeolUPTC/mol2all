import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { GameSession, Progress } from '@core/types/game.types'

interface GameState {
  currentSession: GameSession | null
  allProgress: Progress[]
  lives: number
  energy: number
  score: number
  questionsAnswered: number
  questionsTotal: number
  isPlaying: boolean

  setCurrentSession: (session: GameSession) => void
  setAllProgress: (progress: Progress[]) => void
  updateLives: (lives: number) => void
  updateEnergy: (energy: number) => void
  updateScore: (score: number) => void
  updateQuestionsAnswered: (count: number, total: number) => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      currentSession: null,
      allProgress: [],
      lives: 3,
      energy: 100,
      score: 0,
      questionsAnswered: 0,
      questionsTotal: 0,
      isPlaying: false,

      setCurrentSession: (currentSession) => set({ currentSession }),
      setAllProgress: (allProgress) => set({ allProgress }),
      updateLives: (lives) => set({ lives }),
      updateEnergy: (energy) => set({ energy }),
      updateScore: (score) => set({ score }),
      updateQuestionsAnswered: (questionsAnswered, questionsTotal) =>
        set({ questionsAnswered, questionsTotal }),
      startGame: () =>
        set({ isPlaying: true, lives: 3, energy: 100, score: 0, questionsAnswered: 0, questionsTotal: 0 }),
      endGame: () => set({ isPlaying: false }),
      resetGame: () =>
        set({ lives: 3, energy: 100, score: 0, questionsAnswered: 0, questionsTotal: 0, isPlaying: false, currentSession: null }),
    }),
    { name: 'game-store' },
  ),
)
