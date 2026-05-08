import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await apiClient.post(ENDPOINTS.auth.resetPassword, { token, password })
      setDone(true)
      setTimeout(() => navigate('/auth/login'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'El enlace es inválido o ha expirado.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-game-bg px-4">
        <div className="card w-full max-w-md text-center">
          <p className="text-sm text-red-400">Enlace inválido.</p>
          <Link to="/auth/login" className="mt-4 block text-sm text-brand-400 hover:text-brand-300">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-400">MOL2ALL</h1>
          <p className="mt-2 text-slate-400">Aprende estequiometría jugando</p>
        </div>

        <div className="card">
          {done ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/40 text-3xl">
                ✓
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-100">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-sm text-slate-400">
                Serás redirigido al inicio de sesión en unos segundos…
              </p>
              <Link to="/auth/login" className="btn-primary inline-block w-full py-2.5 text-center">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-6 font-display text-xl font-semibold text-slate-100">
                Nueva contraseña
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input-field"
                    placeholder="Repite la contraseña"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                  {isLoading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
