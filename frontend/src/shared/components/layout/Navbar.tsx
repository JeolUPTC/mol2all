import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await apiClient.post(ENDPOINTS.auth.logout)
    } finally {
      logout()
      navigate('/auth/login')
    }
  }

  return (
    <nav className="border-b border-game-border bg-game-surface px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/dashboard" className="font-display text-xl font-bold text-brand-400">
          MOL2ALL
        </Link>

        <div className="flex items-center gap-4">
          {user?.role === 'TEACHER' && (
            <Link
              to="/teacher"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
            >
              Panel Docente
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <Link
                to="/analytics"
                className="text-sm font-medium text-emerald-500 transition-colors hover:text-emerald-300"
              >
                Analíticas
              </Link>
              <Link
                to="/admin"
                className="text-sm font-medium text-amber-500 transition-colors hover:text-amber-300"
              >
                Admin
              </Link>
            </>
          )}

          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white">
              {user?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span className="hidden md:block">{user?.username}</span>
          </Link>

          <button onClick={handleLogout} className="btn-secondary text-sm">
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
