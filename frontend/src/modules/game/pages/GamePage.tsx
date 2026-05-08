import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { useGameStore } from '@stores/gameStore'
import { useUIStore } from '@stores/uiStore'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import { PhaserGame, type LevelConfig } from '../PhaserGame'
import { sessionsService } from '../services/sessions.service'
import { levelsService } from '@modules/levels/services/levels.service'
import type { ApiResponse } from '@core/types/api.types'
import type { User } from '@core/types/user.types'

export function GamePage() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const { setCurrentSession } = useGameStore()
  const { setUser } = useAuthStore()
  const { addToast } = useUIStore()

  const sessionIdRef = useRef<string | null>(null)
  const sessionCompletedRef = useRef(false)

  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Fetch level data and create session in parallel
  useEffect(() => {
    if (!levelId) {
      navigate('/dashboard')
      return
    }

    let mounted = true

    const init = async () => {
      try {
        const [level, session] = await Promise.all([
          levelsService.getById(levelId),
          sessionsService.create(levelId),
        ])
        if (!mounted) return
        setCurrentSession(session)
        sessionIdRef.current = session.id
        setLevelConfig({
          topic: level.topic,
          difficulty: Math.max(1, Math.min(3, level.difficulty)) as 1 | 2 | 3,
          levelName: level.name,
          totalQuestions: 5,
          levelOrder: level.order,
        })
      } catch (err) {
        console.error('[GamePage] init error:', err)
        if (mounted) setLoadError(true)
        navigate('/dashboard')
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [levelId, navigate, setCurrentSession])

  // Save session result + refresh user profile XP/coins
  const handleComplete = useCallback(
    async (score: number, stars: number) => {
      if (sessionCompletedRef.current || !sessionIdRef.current) return
      sessionCompletedRef.current = true
      try {
        const result = await sessionsService.complete(sessionIdRef.current, {
          score,
          stars,
          timeSpent: 0,
        })
        // Refresh profile so navbar shows updated XP/coins
        const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.users.me)
        setUser(data.data)
        // Queue achievement toasts — they'll display when the user lands on the dashboard
        result.newAchievements.forEach((a) => {
          addToast({ type: 'success', message: `🏆 Logro desbloqueado: ${a.name} (+${a.xpReward} XP)` })
        })
        if (result.xpEarned > 0) {
          addToast({ type: 'info', message: `+${result.xpEarned} XP · +${result.coinsEarned} monedas` })
        }
      } catch {
        // Non-critical — user can still navigate back
      }
    },
    [setUser, addToast],
  )

  // ResultScene dispatches this event on any exit button
  useEffect(() => {
    const onExit = () => navigate('/dashboard')
    window.addEventListener('mol2all:game:exit', onExit)
    return () => window.removeEventListener('mol2all:game:exit', onExit)
  }, [navigate])

  if (loadError) return null

  if (!levelConfig) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="font-display text-sm text-slate-400">Preparando nivel...</p>
      </div>
    )
  }

  return (
    <div
      className="relative w-screen overflow-hidden bg-black"
      style={{ height: '100dvh' }}
    >
      <PhaserGame levelConfig={levelConfig} onComplete={handleComplete} />
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute left-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/90 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-xl backdrop-blur-sm transition-all hover:border-sky-500/60 hover:bg-slate-800 hover:text-white"
      >
        <span className="text-lg leading-none">←</span>
        <span>Salir</span>
      </button>
    </div>
  )
}
