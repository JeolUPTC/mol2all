import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { MenuScene } from '../scenes/MenuScene'
import { GameScene } from '../scenes/GameScene'
import { PlayScene } from '../scenes/PlayScene'
import { RouletteScene } from '../scenes/RouletteScene'
import { QuizScene } from '../scenes/QuizScene'
import { ResultScene } from '../scenes/ResultScene'
import { CalculatorScene } from '../scenes/CalculatorScene'
import { PeriodicTableScene } from '../scenes/PeriodicTableScene'

export const createPhaserConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 300 }, debug: import.meta.env.DEV },
  },
  render: {
    antialias: true,
    roundPixels: true,
  },
  scene: [BootScene, MenuScene, GameScene, PlayScene, RouletteScene, QuizScene, ResultScene, CalculatorScene, PeriodicTableScene],
})
