import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await apiClient.post(ENDPOINTS.auth.forgotPassword, { email })
      setSent(true)
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-400">MOL2ALL</h1>
          <p className="mt-2 text-slate-400">Aprende estequiometría jugando</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/40 text-3xl">
                ✉
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-100">
                Revisa tu correo
              </h2>
              <p className="text-sm text-slate-400">
                Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                El enlace expira en <span className="text-slate-200">1 hora</span>.
              </p>
              <Link to="/auth/login" className="btn-secondary inline-block w-full py-2.5 text-center">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 font-display text-xl font-semibold text-slate-100">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="estudiante@escuela.edu"
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                  {isLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-400">
                <Link to="/auth/login" className="font-medium text-brand-400 hover:text-brand-300">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
