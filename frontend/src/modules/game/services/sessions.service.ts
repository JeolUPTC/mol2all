import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { Achievement, GameSession } from '@core/types/game.types'
import type { ApiResponse } from '@core/types/api.types'

interface CompletePayload {
  score: number
  stars: number
  timeSpent: number
}

export interface CompleteResult {
  xpEarned: number
  coinsEarned: number
  newAchievements: Achievement[]
}

export const sessionsService = {
  async create(levelId: string): Promise<GameSession> {
    const { data } = await apiClient.post<ApiResponse<GameSession>>(ENDPOINTS.game.sessions, {
      levelId,
    })
    return data.data
  },

  // Backend uses @Post for complete (state transition via RPC-style endpoint)
  async complete(sessionId: string, payload: CompletePayload): Promise<CompleteResult> {
    const { data } = await apiClient.post<ApiResponse<CompleteResult>>(
      ENDPOINTS.game.complete(sessionId),
      payload,
    )
    return data.data
  },
}
