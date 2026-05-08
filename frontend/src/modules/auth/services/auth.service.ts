import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { LoginPayload, RegisterPayload, AuthTokens, User } from '@core/types/user.types'
import type { ApiResponse } from '@core/types/api.types'

export const authService = {
  async login(payload: LoginPayload): Promise<{ tokens: AuthTokens; user: User }> {
    const { data } = await apiClient.post<ApiResponse<{ accessToken: string; user: User }>>(
      ENDPOINTS.auth.login,
      payload,
    )
    return { tokens: { accessToken: data.data.accessToken }, user: data.data.user }
  },

  async register(payload: RegisterPayload): Promise<{ tokens: AuthTokens; user: User }> {
    const { data } = await apiClient.post<ApiResponse<{ accessToken: string; user: User }>>(
      ENDPOINTS.auth.register,
      payload,
    )
    return { tokens: { accessToken: data.data.accessToken }, user: data.data.user }
  },
}
