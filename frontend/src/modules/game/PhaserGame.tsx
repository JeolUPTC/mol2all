import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { useGameStore } from '@stores/gameStore'
import { gameEventBus } from './bridge/gameEventBus'
import { createPhaserConfig } from './config/phaser.config'
import { QuizOverlay } from './components/QuizOverlay'
import { ResultOverlay, type ResultData } from './components/ResultOverlay'
import type { LevelTopic } from '@core/types/game.types'
import type { GameQuestion } from './services/questions.service'

const CONTAINER_ID = 'mol2all-phaser-container'

export interface LevelConfig {
  topic: LevelTopic
  difficulty: 1 | 2 | 3
  levelName: string
  totalQuestions: number
  levelOrder: number
  questions?: GameQuestion[]
}

interface PhaserGameProps {
  levelConfig?: LevelConfig
  onComplete?: (score: number, stars: number) => void
  onRetry?: (levelConfig: ResultData['levelConfig']) => void
}

function useIsPortraitMobile() {
  const check = (): boolean => {
    const w = window.innerWidth
    const h = window.innerHeight
    if (Math.min(w, h) >= 768) return false
    // Try screen orientation API first (most reliable)
    if (window.screen?.orientation?.type) {
      return window.screen.orientation.type.startsWith('portrait')
    }
    // matchMedia fallback
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(orientation: portrait)').matches
    }
    return h > w
  }
  const [portrait, setPortrait] = useState(check)
  useEffect(() => {
    const handler = () => setTimeout(() => setPortrait(check()), 80)
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])
  return portrait
}

interface QuizData {
  question: GameQuestion
  startTime: number
  onAnswer: (isCorrect: boolean, timeSpent: number) => void
}

export function PhaserGame({ levelConfig, onComplete, onRetry }: PhaserGameProps) {
  const { updateLives, updateScore, updateEnergy, updateQuestionsAnswered, endGame } = useGameStore()
  const isPortrait = useIsPortraitMobile()
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [resultData, setResultData] = useState<ResultData | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const game = new Phaser.Game({
      ...createPhaserConfig(CONTAINER_ID),
      callbacks: {
        preBoot: (g: Phaser.Game) => {
          if (levelConfig) {
            g.registry.set('levelConfig', levelConfig)
            g.registry.set('preloadedQuestions', levelConfig.questions ?? [])
          }
        },
      },
    })
    gameRef.current = game

    const unsubScore    = gameEventBus.on('score:updated',      ({ score }) => updateScore(score))
    const unsubLives    = gameEventBus.on('life:lost',           ({ livesRemaining }) => updateLives(livesRemaining))
    const unsubEnergy   = gameEventBus.on('energy:changed',      ({ energy }) => updateEnergy(energy))
    const unsubQA       = gameEventBus.on('question:answered',   ({ count, total }) => updateQuestionsAnswered(count, total))
    const unsubComplete = gameEventBus.on('level:complete',      ({ score, stars }) => { endGame(); onCompleteRef.current?.(score, stars) })
    const unsubFailed   = gameEventBus.on('level:failed',        () => endGame())
    const unsubResult   = gameEventBus.on('level:result',        (data) => setResultData(data))
    const unsubQuiz     = gameEventBus.on('quiz:open', ({ question, onAnswer }) => {
      setQuizData({
        question,
        startTime: Date.now(),
        onAnswer: (isCorrect, timeSpent) => {
          onAnswer(isCorrect, timeSpent)
          setQuizData(null)
        },
      })
    })
    const unsubLaunch   = gameEventBus.on('scene:launch', ({ key, data }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(gameRef.current?.scene as any)?.launch?.(key, data)
    })

    return () => {
      game.destroy(true)
      gameRef.current = null
      unsubScore()
      unsubLives()
      unsubEnergy()
      unsubQA()
      unsubComplete()
      unsubFailed()
      unsubResult()
      unsubQuiz()
      unsubLaunch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = (levelConfig?: ResultData['levelConfig']) => {
    setResultData(null)
    // Delegate to GamePage — it will unmount PhaserGame (destroying Phaser cleanly)
    // and show the React PreGameScreen with fresh questions, exactly like first entry.
    onRetry?.(levelConfig)
  }

  const handleExitToMenu = () => {
    setResultData(null)
    window.dispatchEvent(new CustomEvent('mol2all:game:exit'))
  }

  // Always keep the Phaser canvas mounted — unmounting it while Phaser is running
  // leaves the game loop attached to a detached canvas and causes scroll-lock bugs.
  // Instead, overlay the rotate message on top when portrait is detected.
  return (
    <div className="relative h-full w-full">
      <div
        id={CONTAINER_ID}
        className="h-full w-full"
        style={{ touchAction: 'none' }}
      />
      {isPortrait && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900/97 p-6 text-center">
          <span className="text-6xl">🔄</span>
          <p className="text-2xl font-bold text-sky-300">Rota tu dispositivo</p>
          <p className="text-base text-slate-400">
            El juego está diseñado para pantalla horizontal.
            <br />
            Gira tu móvil para jugar.
          </p>
        </div>
      )}
      {quizData && !isPortrait && (
        <QuizOverlay
          question={quizData.question}
          startTime={quizData.startTime}
          onAnswer={quizData.onAnswer}
        />
      )}
      {resultData && (
        <ResultOverlay
          data={resultData}
          onRetry={handleRetry}
          onExit={handleExitToMenu}
        />
      )}
    </div>
  )
}
