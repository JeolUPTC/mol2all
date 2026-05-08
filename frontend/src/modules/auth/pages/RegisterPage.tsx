import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegisterForm } from '../hooks/useAuthForm'

export function RegisterPage() {
  const { submit, error, isLoading } = useRegisterForm()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    submit({ email, username, password })
  }

  const displayError = localError ?? error

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-400">MOL2ALL</h1>
          <p className="mt-2 text-slate-400">Crea tu cuenta y comienza a aprender</p>
        </div>

        <div className="card">
          <h2 className="mb-6 font-display text-xl font-semibold text-slate-100">
            Crear cuenta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="moleculero42"
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Mínimo 8 caracteres"
                required
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
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            {displayError && (
              <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">
                {displayError}
              </p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth/login" className="font-medium text-brand-400 hover:text-brand-300">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
