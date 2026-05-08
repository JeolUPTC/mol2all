import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { authService } from '../services/auth.service'
import type { LoginPayload, RegisterPayload } from '@core/types/user.types'

export function useLoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setAccessToken } = useAuthStore()
  const navigate = useNavigate()

  const submit = async (payload: LoginPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const { tokens, user } = await authService.login(payload)
      setAccessToken(tokens.accessToken)
      setUser(user)
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'TEACHER') navigate('/teacher')
      else navigate('/dashboard')
    } catch {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, error, isLoading }
}

export function useRegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setAccessToken } = useAuthStore()
  const navigate = useNavigate()

  const submit = async (payload: RegisterPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const { tokens, user } = await authService.register(payload)
      setAccessToken(tokens.accessToken)
      setUser(user)
      navigate('/dashboard')
    } catch {
      setError('No se pudo crear la cuenta. El email o usuario ya existe.')
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, error, isLoading }
}
