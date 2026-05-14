import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { useGameStore } from '@stores/gameStore'
import { useUIStore } from '@stores/uiStore'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import { PhaserGame, type LevelConfig, checkIsPortraitMobile, useIsPortraitMobile } from '../PhaserGame'
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

  // Portrait detection — PhaserGame must not mount until we're in landscape.
  // Once mounted it stays mounted (unmounting a live Phaser canvas causes bugs).
  const isPortrait = useIsPortraitMobile()
  const [phaserMounted, setPhaserMounted] = useState(() => !checkIsPortraitMobile())
  useEffect(() => {
    if (!isPortrait) setPhaserMounted(true)
  }, [isPortrait])

  // Canvas height — use window.innerHeight instead of 100vh so the value
  // updates correctly when the browser address bar appears/disappears or when
  // the orientation changes. A fixed pixel value also prevents Phaser's
  // ResizeObserver from entering a layout loop (flex-1 on an unsized flex
  // parent causes continuous re-measurements).
  const HUD_H = 56
  const [canvasH, setCanvasH] = useState(() => window.innerHeight - HUD_H)
  useEffect(() => {
    const onResize = () => setCanvasH(window.innerHeight - HUD_H)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])


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

  // Called by PreGameScreen when questions are ready and user clicks Jugar.
  // requestFullscreen must be called here — inside the user-gesture handler —
  // so the browser allows it (hides the address bar on mobile).
  const handlePlay = useCallback((loadedQuestions: GameQuestion[]) => {
    setQuestions(loadedQuestions)
    startGame()
    setGameState('playing')
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouch) {
      type AnyEl = Element & { webkitRequestFullscreen?: () => Promise<void> }
      const el = document.documentElement as AnyEl
      ;(el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el).catch(() => {})
    }
  }, [startGame])

  // Retry: go back to PreGameScreen (PhaserGame unmounts → Phaser destroyed cleanly)
  const handleRetry = useCallback(() => {
    sessionCompletedRef.current = false
    setGameState('pregame')
  }, [])

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

  const exitFullscreen = useCallback(() => {
    type AnyDoc = Document & { webkitExitFullscreen?: () => Promise<void> }
    const doc = document as AnyDoc
    if (doc.fullscreenElement) {
      ;(doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc).catch(() => {})
    }
  }, [])

  // ResultScene exit event
  useEffect(() => {
    const onExit = () => { exitFullscreen(); navigate('/dashboard') }
    window.addEventListener('mol2all:game:exit', onExit)
    return () => window.removeEventListener('mol2all:game:exit', onExit)
  }, [navigate, exitFullscreen])

  // ── Render ──────────────────────────────────────────────────────────────

  if (gameState === 'loading' || !levelConfig) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-950">
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

  // playing — HUD (h-14 = 56px) on top, Phaser fills the rest exactly.
  // PhaserGame is not mounted until the first landscape moment; until then a
  // full-screen overlay covers everything (HUD included) asking to rotate.
  return (
    <div className="relative flex flex-1 flex-col bg-slate-950" style={{ touchAction: 'none' }}>
      <GameHUD
        levelName={levelConfig.levelName}
        topic={levelConfig.topic}
        onExit={() => { exitFullscreen(); navigate('/dashboard') }}
      />
      <div style={{ height: canvasH, width: '100%' }}>
        {phaserMounted && (
          <PhaserGame
            levelConfig={{ ...levelConfig, questions }}
            onComplete={handleComplete}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Full-screen portrait guard — covers HUD + canvas */}
      {isPortrait && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-900/40">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-sky-300">Rota tu dispositivo</p>
            <p className="mt-2 text-base text-slate-400">
              El juego está diseñado para pantalla horizontal.
              <br />
              Gira tu móvil para jugar.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
