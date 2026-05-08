import Phaser from 'phaser'
import { THEORY, DEFAULT_THEORY } from '../data/theory.data'

interface TheorySceneData {
  topic: string
  onClose: () => void
}

export class TheoryScene extends Phaser.Scene {
  private sceneData!: TheorySceneData

  constructor() {
    super({ key: 'TheoryScene' })
  }

  init(data: TheorySceneData) {
    this.sceneData = data
  }

  create() {
    const { width, height } = this.cameras.main
    const theory = THEORY[this.sceneData.topic] ?? DEFAULT_THEORY

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value))

    const titleSize = clamp(width * 0.018, 26, 34)
    const textSize = clamp(width * 0.011, 17, 21)
    const smallSize = clamp(width * 0.009, 15, 18)
    const formulaSize = clamp(width * 0.026, 32, 46)
    const exampleSize = clamp(width * 0.017, 25, 34)

    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.94)

    const modalW = Math.min(width * 0.9, 1280)
    const modalH = Math.min(height * 0.88, 760)
    const modalX = width / 2
    const modalY = height / 2

    this.add
      .rectangle(modalX, modalY, modalW, modalH, 0x0f172a)
      .setStrokeStyle(2, 0x0ea5e9)

    const padding = 36
    const leftX = modalX - modalW / 2 + padding
    const topY = modalY - modalH / 2 + padding

    const contentW = modalW * 0.66
    const sideW = modalW * 0.24
    const sideX = modalX + modalW / 2 - padding - sideW
    const centerSideX = sideX + sideW / 2

    let y = topY

    this.add.text(leftX, y, `📘 ${theory.title}`, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${titleSize}px`,
      color: '#38bdf8',
      fontStyle: 'bold',
    })

    y += 50

    this.add.text(leftX, y, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${smallSize}px`,
      color: '#94a3b8',
    })

    y += 38

    this.add.text(leftX, y, theory.concept, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize}px`,
      color: '#e2e8f0',
      wordWrap: { width: contentW },
      lineSpacing: 8,
    })

    y += 95

    const formulaBoxH = 135

    this.add
      .rectangle(leftX + contentW / 2, y + formulaBoxH / 2, contentW, formulaBoxH, 0x082f49)
      .setStrokeStyle(2, 0x38bdf8)

    this.add.text(leftX + contentW / 2, y + 34, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: `${formulaSize}px`,
      color: '#7dd3fc',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0)

    this.add.text(leftX + contentW / 2, y + 98, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${smallSize}px`,
      color: '#cbd5e1',
    }).setOrigin(0.5, 0)

    y += formulaBoxH + 32

    this.add.text(leftX, y, '💡 Ejemplo práctico', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize + 3}px`,
      color: '#facc15',
      fontStyle: 'bold',
    })

    y += 42

    this.add.text(leftX, y, theory.example, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: `${exampleSize}px`,
      color: '#fde68a',
      wordWrap: { width: contentW },
    })

    y += 70

    this.add.text(leftX, y, '✦ Pasos clave', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize + 2}px`,
      color: '#10b981',
      fontStyle: 'bold',
    })

    y += 40

    theory.tips.forEach((tip, i) => {
      this.add.text(leftX, y, `${i + 1}. ${tip}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: `${textSize}px`,
        color: '#cbd5e1',
        wordWrap: { width: contentW },
        lineSpacing: 6,
      })
      y += 36
    })

    this.add
      .rectangle(centerSideX, modalY, sideW, modalH - padding * 2, 0x111827)
      .setStrokeStyle(1, 0x1e3a5f)

    this.add.text(centerSideX, topY + 55, 'Introducción', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize + 2}px`,
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(centerSideX, topY + 110, theory.title, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize}px`,
      color: '#38bdf8',
      align: 'center',
      wordWrap: { width: sideW - 32 },
    }).setOrigin(0.5)

    this.add.text(centerSideX, topY + 185, '★★★', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '28px',
      color: '#facc15',
    }).setOrigin(0.5)

    this.add.text(centerSideX, topY + 255, '✓ Preguntas listas', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize}px`,
      color: '#10b981',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const playBtnY = modalY + modalH / 2 - 90

    const playBtn = this.add
      .rectangle(centerSideX, playBtnY, sideW - 36, 72, 0x0284c7)
      .setStrokeStyle(2, 0x38bdf8)
      .setInteractive({ useHandCursor: true })

    this.add.text(centerSideX, playBtnY, '▶ ¡Jugar!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${textSize + 4}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    playBtn.on('pointerover', () => playBtn.setFillStyle(0x0369a1))
    playBtn.on('pointerout', () => playBtn.setFillStyle(0x0284c7))
    playBtn.on('pointerdown', () => {
      this.scene.stop('TheoryScene')
      this.sceneData.onClose()
    })
  }
}
