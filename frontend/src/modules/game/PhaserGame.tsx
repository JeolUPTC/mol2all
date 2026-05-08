import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { useGameStore } from '@stores/gameStore'
import { gameEventBus } from './bridge/gameEventBus'
import { createPhaserConfig } from './config/phaser.config'
import type { LevelTopic } from '@core/types/game.types'

const CONTAINER_ID = 'mol2all-phaser-container'

export interface LevelConfig {
  topic: LevelTopic
  difficulty: 1 | 2 | 3
  levelName: string
  totalQuestions: number
  levelOrder: number
}

interface PhaserGameProps {
  levelConfig?: LevelConfig
  onComplete?: (score: number, stars: number) => void
}

function useIsPortraitMobile() {
  const check = () =>
    window.innerWidth < 768 && window.innerHeight > window.innerWidth
  const [portrait, setPortrait] = useState(check)
  useEffect(() => {
    const handler = () => setPortrait(check())
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
  const { updateLives, updateScore, updateEnergy, endGame } = useGameStore()
  const isPortrait = useIsPortraitMobile()

  // Stable ref so the Phaser event handler always sees the latest callback
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const game = new Phaser.Game(createPhaserConfig(CONTAINER_ID))

    // Registry is synchronously available; BootScene reads it on the first animation frame
    if (levelConfig) {
      game.registry.set('levelConfig', levelConfig)
    }

    const unsubScore = gameEventBus.on('score:updated', ({ score }) => updateScore(score))
    const unsubLives = gameEventBus.on('life:lost', ({ livesRemaining }) => updateLives(livesRemaining))
    const unsubEnergy = gameEventBus.on('energy:changed', ({ energy }) => updateEnergy(energy))
    const unsubComplete = gameEventBus.on('level:complete', ({ score, stars }) => {
      endGame()
      onCompleteRef.current?.(score, stars)
    })
    const unsubFailed = gameEventBus.on('level:failed', () => {
      endGame()
      // Deliberately NOT calling handleComplete here: a failed run must not lock
      // sessionCompletedRef so that the player can retry and get the win recorded.
    })

    return () => {
      game.destroy(true)
      unsubScore()
      unsubLives()
      unsubEnergy()
      unsubComplete()
      unsubFailed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally once — levelConfig goes via Phaser registry, not re-render

  if (isPortrait) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-6xl">🔄</span>
        <p className="text-xl font-bold text-sky-300">Rota tu dispositivo</p>
        <p className="text-sm text-slate-400">
          El juego está diseñado para pantalla horizontal.<br />
          Gira tu móvil para jugar.
        </p>
      </div>
    )
  }

  return <div id={CONTAINER_ID} className="h-full w-full" />
}
