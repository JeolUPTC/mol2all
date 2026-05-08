import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { useGameStore } from '@stores/gameStore'
import { useUIStore } from '@stores/uiStore'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { LevelWithProgress } from '@core/types/game.types'
import type { ApiResponse } from '@core/types/api.types'
import type { User } from '@core/types/user.types'
import { LevelCard } from '../components/LevelCard'
import { PlayerStats } from '../components/PlayerStats'

export function StudentDashboard() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { setAllProgress } = useGameStore()
  const { addToast } = useUIStore()
  const [levels, setLevels] = useState<LevelWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<LevelWithProgress[]>>(ENDPOINTS.levels.list)
        setLevels(data.data)
        setAllProgress(data.data.map((l) => l.progress).filter(Boolean) as never)
      } catch {
        // silencia error de red
      } finally {
        setIsLoading(false)
      }
    }
    fetchLevels()
  }, [setAllProgress])

  const handlePlay = (level: LevelWithProgress) => {
    if (!level.isUnlocked) return
    navigate(`/game/${level.id}`)
  }

  const handleResetProgress = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 5000)
      return
    }
    setIsResetting(true)
    setConfirmReset(false)
    try {
      await apiClient.post(ENDPOINTS.users.resetProgress)
      const { data: userData } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.users.me)
      setUser(userData.data)
      const { data: levelsData } = await apiClient.get<ApiResponse<LevelWithProgress[]>>(ENDPOINTS.levels.list)
      setLevels(levelsData.data)
      setAllProgress(levelsData.data.map((l) => l.progress).filter(Boolean) as never)
      addToast({ type: 'info', message: '🔄 Progreso reiniciado. ¡Empieza de nuevo!' })
    } catch {
      addToast({ type: 'error', message: 'No se pudo reiniciar el progreso.' })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-100">
            ¡Hola, {user?.profile?.displayName ?? user?.username}!
          </h1>
          <p className="mt-1 text-slate-400">Continúa tu aventura en estequiometría</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PlayerStats />
          <button
            onClick={handleResetProgress}
            disabled={isResetting}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
              confirmReset
                ? 'border-red-500/70 bg-red-500/15 text-red-300 font-semibold'
                : 'border-slate-700/50 bg-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            {isResetting ? '↺ Reiniciando…' : confirmReset ? '¿Confirmar? Clic de nuevo' : '↺ Reiniciar progreso'}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-slate-200">Niveles</h2>
        <p className="text-sm text-slate-400">Completa cada nivel para desbloquear el siguiente</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-game-surface" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => (
            <LevelCard key={level.id} level={level} onPlay={() => handlePlay(level)} />
          ))}
        </div>
      )}
    </div>
  )
}
