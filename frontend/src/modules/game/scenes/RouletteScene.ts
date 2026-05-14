import Phaser from 'phaser'
import { gameEventBus } from '../bridge/gameEventBus'
import type { GameQuestion } from '../services/questions.service'

interface RouletteSceneData {
  totalQuestions: number
  selectedNumber: number   // 1-based
  question: GameQuestion
  onAnswer: (isCorrect: boolean, timeSpent: number) => void
}

const SECTOR_COLORS = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6, 0x8b5cf6, 0xec4899]

export class RouletteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RouletteScene' })
  }

  init(data: RouletteSceneData) {
    const { width, height } = this.cameras.main
    const { totalQuestions, selectedNumber, question, onAnswer } = data
    const selectedIndex = selectedNumber - 1

    // Scale everything to fit the available canvas — design reference is 500px tall
    const s = Math.max(0.55, Math.min(1, height / 500, width / 420))

    const radius    = Math.round(128 * s)
    const panelW    = Math.round(380 * s)
    const panelH    = Math.round(400 * s)
    const titleSize = Math.round(22 * s)
    const numSize   = Math.round(28 * s)

    const cx = width  / 2
    const cy = height / 2 + Math.round(16 * s)

    // Dark overlay + panel
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.86)
    this.add.rectangle(cx, height / 2, panelW, panelH, 0x0f172a).setStrokeStyle(3, 0xf59e0b)

    // Title
    this.add
      .text(cx, cy - radius - Math.round(46 * s), '¡GIRA LA RULETA!', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: `${titleSize}px`,
        color: '#f59e0b',
        fontStyle: 'bold',
        stroke: '#78350f',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // Spinning wheel container
    const wheelContainer = this.add.container(cx, cy)
    const gfx = this.add.graphics()
    wheelContainer.add(gfx)

    const sectorRad = (Math.PI * 2) / totalQuestions
    const texts: Phaser.GameObjects.Text[] = []

    for (let i = 0; i < totalQuestions; i++) {
      const startAngle = -Math.PI / 2 + i * sectorRad
      const endAngle   = startAngle + sectorRad
      const color      = SECTOR_COLORS[i % SECTOR_COLORS.length]

      gfx.fillStyle(color, 1)
      gfx.beginPath()
      gfx.moveTo(0, 0)
      gfx.arc(0, 0, radius, startAngle, endAngle, false)
      gfx.closePath()
      gfx.fillPath()

      gfx.lineStyle(2, 0xffffff, 0.55)
      gfx.beginPath()
      gfx.moveTo(0, 0)
      gfx.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius)
      gfx.strokePath()

      const midAngle = startAngle + sectorRad / 2
      const tr  = radius * 0.64
      const txt = this.add
        .text(Math.cos(midAngle) * tr, Math.sin(midAngle) * tr, `${i + 1}`, {
          fontFamily: 'Exo 2, system-ui',
          fontSize: `${numSize}px`,
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#00000088',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
      wheelContainer.add(txt)
      texts.push(txt)
    }

    // Outer gold ring
    gfx.lineStyle(Math.round(5 * s), 0xf59e0b, 1)
    gfx.strokeCircle(0, 0, radius)

    // Center pin
    gfx.fillStyle(0xffffff, 1); gfx.fillCircle(0, 0, Math.round(20 * s))
    gfx.fillStyle(0x0f172a,  1); gfx.fillCircle(0, 0, Math.round(14 * s))
    gfx.fillStyle(0xf59e0b,  1); gfx.fillCircle(0, 0, Math.round(7  * s))

    // Pointer triangle
    const ptrSize = Math.round(14 * s)
    const ptr = this.add.graphics()
    ptr.fillStyle(0xfbbf24, 1)
    ptr.fillTriangle(
      cx,           cy - radius + Math.round(6 * s),
      cx - ptrSize, cy - radius - Math.round(22 * s),
      cx + ptrSize, cy - radius - Math.round(22 * s),
    )
    ptr.lineStyle(2, 0xffffff, 0.9)
    ptr.strokeTriangle(
      cx,           cy - radius + Math.round(6 * s),
      cx - ptrSize, cy - radius - Math.round(22 * s),
      cx + ptrSize, cy - radius - Math.round(22 * s),
    )

    // Result label
    const resultTxt = this.add
      .text(cx, cy + radius + Math.round(28 * s), '', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: `${Math.round(20 * s)}px`,
        color: '#fbbf24',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    // Spin animation
    const sectorDeg = 360 / totalQuestions
    const Rfinal    = (360 - (selectedIndex + 0.5) * sectorDeg) % 360
    const Rtotal    = 360 * 6 + Rfinal

    this.time.delayedCall(350, () => {
      this.tweens.add({
        targets: wheelContainer,
        angle: Rtotal,
        duration: 4500,
        ease: 'Cubic.Out',
        onUpdate: () => {
          const counterRad = -Phaser.Math.DegToRad(wheelContainer.angle)
          for (const t of texts) t.rotation = counterRad
        },
        onComplete: () => {
          resultTxt.setText(`¡Pregunta ${selectedNumber}!`)
          this.tweens.add({ targets: resultTxt, alpha: 1, y: cy + radius + Math.round(28 * s), duration: 320 })
          this.tweens.add({ targets: wheelContainer, scaleX: 1.07, scaleY: 1.07, duration: 180, yoyo: true })
          this.time.delayedCall(1400, () => {
            this.cameras.main.fadeOut(260)
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.stop('RouletteScene')
              gameEventBus.emit('quiz:open', { question, onAnswer })
            })
          })
        },
      })
    })
  }
}
