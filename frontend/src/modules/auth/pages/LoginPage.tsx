import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoginForm } from '../hooks/useAuthForm'

export function LoginPage() {
  const { submit, error, isLoading } = useLoginForm()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-400">MOL2ALL</h1>
          <p className="mt-2 text-slate-400">Aprende estequiometría jugando</p>
        </div>

        <div className="card">
          <h2 className="mb-6 font-display text-xl font-semibold text-slate-100">
            Iniciar sesión
          </h2>

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

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-400">Contraseña</label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-300"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Tu cuenta es creada por el administrador o tu docente.
          </p>
        </div>
      </div>
    </div>
  )
}
