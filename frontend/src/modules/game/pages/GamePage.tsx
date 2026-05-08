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
import { PreGameScreen } from '../components/PreGameScreen'
import { GameHUD } from '../components/GameHUD'
import type { GameQuestion } from '../services/questions.service'
import type { ApiResponse } from '@core/types/api.types'
import type { User } from '@core/types/user.types'

type GameState = 'loading' | 'pregame' | 'playing'

export function GamePage() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const { setCurrentSession, startGame } = useGameStore()
  const { setUser } = useAuthStore()
  const { addToast } = useUIStore()

  const sessionIdRef = useRef<string | null>(null)
  const sessionCompletedRef = useRef(false)

  const [gameState, setGameState] = useState<GameState>('loading')
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null)
  const [questions, setQuestions] = useState<GameQuestion[]>([])

  // Load level metadata and create session
  useEffect(() => {
    if (!levelId) { navigate('/dashboard'); return }

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
        setGameState('pregame')
      } catch (err) {
        console.error('[GamePage] init error:', err)
        if (mounted) navigate('/dashboard')
      }
    }
    init()
    return () => { mounted = false }
  }, [levelId, navigate, setCurrentSession])

  // Called by PreGameScreen when questions are ready and user clicks Jugar
  const handlePlay = useCallback((loadedQuestions: GameQuestion[]) => {
    setQuestions(loadedQuestions)
    startGame()
    setGameState('playing')
  }, [startGame])

  // Save session result + refresh profile
  const handleComplete = useCallback(
    async (score: number, stars: number) => {
      if (sessionCompletedRef.current || !sessionIdRef.current) return
      sessionCompletedRef.current = true
      try {
        const result = await sessionsService.complete(sessionIdRef.current, { score, stars, timeSpent: 0 })
        const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.users.me)
        setUser(data.data)
        result.newAchievements.forEach((a) => {
          addToast({ type: 'success', message: `🏆 Logro desbloqueado: ${a.name} (+${a.xpReward} XP)` })
        })
        if (result.xpEarned > 0) {
          addToast({ type: 'info', message: `+${result.xpEarned} XP · +${result.coinsEarned} monedas` })
        }
      } catch { /* non-critical */ }
    },
    [setUser, addToast],
  )

  // ResultScene exit event
  useEffect(() => {
    const onExit = () => navigate('/dashboard')
    window.addEventListener('mol2all:game:exit', onExit)
    return () => window.removeEventListener('mol2all:game:exit', onExit)
  }, [navigate])

  // ── Render ──────────────────────────────────────────────────────────────

  if (gameState === 'loading' || !levelConfig) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="font-display text-sm text-slate-400">Preparando nivel...</p>
      </div>
    )
  }

  if (gameState === 'pregame') {
    return (
      <PreGameScreen
        levelConfig={levelConfig}
        onPlay={handlePlay}
        onExit={() => navigate('/dashboard')}
      />
    )
  }

  // playing — HUD on top, Phaser canvas fills the rest
  return (
    <div className="flex flex-col bg-black" style={{ height: '100dvh', touchAction: 'none' }}>
      <GameHUD
        levelName={levelConfig.levelName}
        onExit={() => navigate('/dashboard')}
      />
      <div className="relative flex-1 overflow-hidden">
        <PhaserGame
          levelConfig={{ ...levelConfig, questions }}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
