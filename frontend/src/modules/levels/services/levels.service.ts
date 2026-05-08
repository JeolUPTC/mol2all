import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { LevelWithProgress } from '@core/types/game.types'
import type { ApiResponse } from '@core/types/api.types'

export const levelsService = {
  async getAll(): Promise<LevelWithProgress[]> {
    const { data } = await apiClient.get<ApiResponse<LevelWithProgress[]>>(ENDPOINTS.levels.list)
    return data.data
  },

  async getById(id: string): Promise<LevelWithProgress> {
    const { data } = await apiClient.get<ApiResponse<LevelWithProgress>>(
      ENDPOINTS.levels.detail(id),
    )
    return data.data
  },
}
