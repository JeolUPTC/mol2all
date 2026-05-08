import Phaser from 'phaser'
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

    const cx = width / 2
    const cy = height / 2 + 16
    const radius = 128

    // Dark overlay + panel
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.86)
    this.add.rectangle(cx, height / 2, 380, 400, 0x0f172a).setStrokeStyle(3, 0xf59e0b)

    // Title
    this.add
      .text(cx, cy - radius - 46, '¡GIRA LA RULETA!', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '22px',
        color: '#f59e0b',
        fontStyle: 'bold',
        stroke: '#78350f',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // ── Spinning wheel container (this is what we rotate) ─────────────────
    const wheelContainer = this.add.container(cx, cy)

    const gfx = this.add.graphics()
    wheelContainer.add(gfx)

    const sectorRad = (Math.PI * 2) / totalQuestions
    const texts: Phaser.GameObjects.Text[] = []

    for (let i = 0; i < totalQuestions; i++) {
      const startAngle = -Math.PI / 2 + i * sectorRad
      const endAngle = startAngle + sectorRad
      const color = SECTOR_COLORS[i % SECTOR_COLORS.length]

      // Sector fill
      gfx.fillStyle(color, 1)
      gfx.beginPath()
      gfx.moveTo(0, 0)
      gfx.arc(0, 0, radius, startAngle, endAngle, false)
      gfx.closePath()
      gfx.fillPath()

      // Separator lines
      gfx.lineStyle(2, 0xffffff, 0.55)
      gfx.beginPath()
      gfx.moveTo(0, 0)
      gfx.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius)
      gfx.strokePath()

      // Number text
      const midAngle = startAngle + sectorRad / 2
      const tr = radius * 0.64
      const txt = this.add
        .text(Math.cos(midAngle) * tr, Math.sin(midAngle) * tr, `${i + 1}`, {
          fontFamily: 'Exo 2, system-ui',
          fontSize: '28px',
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
    gfx.lineStyle(5, 0xf59e0b, 1)
    gfx.strokeCircle(0, 0, radius)

    // Center pin
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(0, 0, 20)
    gfx.fillStyle(0x0f172a, 1)
    gfx.fillCircle(0, 0, 14)
    gfx.fillStyle(0xf59e0b, 1)
    gfx.fillCircle(0, 0, 7)

    // ── Fixed pointer (triangle pointing down toward wheel) ───────────────
    const ptr = this.add.graphics()
    ptr.fillStyle(0xfbbf24, 1)
    ptr.fillTriangle(
      cx,      cy - radius + 6,   // tip (inside wheel edge)
      cx - 14, cy - radius - 22,  // top-left
      cx + 14, cy - radius - 22,  // top-right
    )
    ptr.lineStyle(2, 0xffffff, 0.9)
    ptr.strokeTriangle(
      cx,      cy - radius + 6,
      cx - 14, cy - radius - 22,
      cx + 14, cy - radius - 22,
    )

    // ── Result label (shown after spin) ───────────────────────────────────
    const resultTxt = this.add
      .text(cx, cy + radius + 28, '', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '20px',
        color: '#fbbf24',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    // ── Calculate final wheel angle ───────────────────────────────────────
    // Pointer sits at top (world -90°). Sector i midpoint, before rotation,
    // is at -90° + (i+0.5)*(360/N)°. To bring sector selectedIndex to the top:
    // container.angle = -(selectedIndex + 0.5) * (360/N)  mod 360
    const sectorDeg = 360 / totalQuestions
    const Rfinal = (360 - (selectedIndex + 0.5) * sectorDeg) % 360
    const Rtotal = 360 * 6 + Rfinal   // 6 full spins for drama

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
          this.tweens.add({ targets: resultTxt, alpha: 1, y: cy + radius + 28, duration: 320 })

          // Pulse wheel once
          this.tweens.add({
            targets: wheelContainer,
            scaleX: 1.07, scaleY: 1.07,
            duration: 180, yoyo: true,
          })

          // Go to quiz after short pause
          this.time.delayedCall(1400, () => {
            this.cameras.main.fadeOut(260)
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.stop('RouletteScene')
              this.scene.launch('QuizScene', { question, onAnswer })
            })
          })
        },
      })
    })
  }
}
