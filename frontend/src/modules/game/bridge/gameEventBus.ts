type EventMap = {
  'answer:submitted': { questionId: string; isCorrect: boolean; timeSpent: number }
  'life:lost': { livesRemaining: number }
  'energy:changed': { energy: number }
  'score:updated': { score: number }
  'question:answered': { count: number; total: number }
  'level:complete': { score: number; stars: number; timeSpent: number }
  'level:failed': { reason: string }
  'scene:ready': { sceneName: string }
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
