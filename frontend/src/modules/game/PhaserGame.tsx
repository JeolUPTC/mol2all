import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { useGameStore } from '@stores/gameStore'
import { gameEventBus } from './bridge/gameEventBus'
import { createPhaserConfig } from './config/phaser.config'
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

export function PhaserGame({ levelConfig, onComplete }: PhaserGameProps) {
  const { updateLives, updateScore, updateEnergy, updateQuestionsAnswered, endGame } = useGameStore()
  const isPortrait = useIsPortraitMobile()

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

    const unsubScore    = gameEventBus.on('score:updated',      ({ score }) => updateScore(score))
    const unsubLives    = gameEventBus.on('life:lost',           ({ livesRemaining }) => updateLives(livesRemaining))
    const unsubEnergy   = gameEventBus.on('energy:changed',      ({ energy }) => updateEnergy(energy))
    const unsubQA       = gameEventBus.on('question:answered',   ({ count, total }) => updateQuestionsAnswered(count, total))
    const unsubComplete = gameEventBus.on('level:complete',      ({ score, stars }) => { endGame(); onCompleteRef.current?.(score, stars) })
    const unsubFailed   = gameEventBus.on('level:failed',        () => endGame())

    return () => {
      game.destroy(true)
      unsubScore()
      unsubLives()
      unsubEnergy()
      unsubQA()
      unsubComplete()
      unsubFailed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    </div>
  )
}
