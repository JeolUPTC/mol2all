import type { GameQuestion } from '../services/questions.service'

type EventMap = {
  'answer:submitted': { questionId: string; isCorrect: boolean; timeSpent: number }
  'life:lost': { livesRemaining: number }
  'energy:changed': { energy: number }
  'score:updated': { score: number }
  'question:answered': { count: number; total: number }
  'level:complete': { score: number; stars: number; timeSpent: number }
  'level:failed': { reason: string }
  'level:result': { score: number; stars: number; win: boolean; levelConfig?: { topic: string; difficulty: number; levelName: string; totalQuestions: number; levelOrder: number } }
  'scene:ready': { sceneName: string }
  'quiz:open': { question: GameQuestion; onAnswer: (isCorrect: boolean, timeSpent: number) => void }
  'scene:launch': { key: string; data?: unknown }
}

type Listener<T> = (payload: T) => void

class GameEventBus {
  private listeners: Partial<{ [K in keyof EventMap]: Listener<EventMap[K]>[] }> = {}

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners[event]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.listeners as any)[event] = []
    }
    (this.listeners[event] as Listener<EventMap[K]>[]).push(listener)
    return () => this.off(event, listener)
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.listeners as any)[event] = (this.listeners[event] as Listener<EventMap[K]>[])?.filter(
      (l) => l !== listener,
    )
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners[event]?.forEach((l) => (l as Listener<EventMap[K]>)(payload))
  }
}

export const gameEventBus = new GameEventBus()
