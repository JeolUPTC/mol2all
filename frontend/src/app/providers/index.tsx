import { useEffect } from 'react'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import { useAuthStore } from '@stores/authStore'
import type { User } from '@core/types/user.types'
import type { ApiResponse } from '@core/types/api.types'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const { setUser, setLoading, logout } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.users.me)
        setUser(data.data)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [setUser, setLoading, logout])

  return <>{children}</>
}
