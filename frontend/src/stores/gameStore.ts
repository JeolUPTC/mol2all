import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Level, GameSession, Progress } from '@core/types/game.types'

interface GameState {
  currentLevel: Level | null
  currentSession: GameSession | null
  allProgress: Progress[]
  lives: number
  energy: number
  score: number
  isPlaying: boolean

  setCurrentLevel: (level: Level) => void
  setCurrentSession: (session: GameSession) => void
  setAllProgress: (progress: Progress[]) => void
  updateLives: (lives: number) => void
  updateEnergy: (energy: number) => void
  updateScore: (score: number) => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      currentLevel: null,
      currentSession: null,
      allProgress: [],
      lives: 3,
      energy: 100,
      score: 0,
      isPlaying: false,

      setCurrentLevel: (currentLevel) => set({ currentLevel }),
      setCurrentSession: (currentSession) => set({ currentSession }),
      setAllProgress: (allProgress) => set({ allProgress }),
      updateLives: (lives) => set({ lives }),
      updateEnergy: (energy) => set({ energy }),
      updateScore: (score) => set({ score }),
      startGame: () => set({ isPlaying: true, lives: 3, energy: 100, score: 0 }),
      endGame: () => set({ isPlaying: false }),
      resetGame: () =>
        set({ lives: 3, energy: 100, score: 0, isPlaying: false, currentSession: null }),
    }),
    { name: 'game-store' },
  ),
)
