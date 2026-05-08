import Phaser from 'phaser'
import { THEORY, DEFAULT_THEORY } from '../data/theory.data'

interface TheorySceneData {
  topic: string
  onClose: () => void
}

export class TheoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TheoryScene' })
  }

  init(data: TheorySceneData) {
    const { width, height } = this.cameras.main
    const theory = THEORY[data.topic] ?? DEFAULT_THEORY
    const cx = width / 2
    const cy = height / 2

    const closeBtnH = 44
    const panelW = Math.min(700, width - 16)
    const panelH = Math.min(520, height - 16)

    // Overlay
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.88)

    // Panel
    this.add.rectangle(cx, cy, panelW, panelH, 0x0f172a).setStrokeStyle(2, 0x38bdf8)

    // Large close button at the very bottom of the panel (touch-friendly)
    const closeBtnY = cy + panelH / 2 - closeBtnH / 2 - 6
    const closeBg = this.add
      .rectangle(cx, closeBtnY, panelW - 16, closeBtnH, 0x1e3a5f)
      .setInteractive({ useHandCursor: true })
    this.add.text(cx, closeBtnY, '✕  Cerrar teoría', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '16px',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    closeBg.on('pointerover', () => closeBg.setFillStyle(0x075985))
    closeBg.on('pointerout',  () => closeBg.setFillStyle(0x1e3a5f))
    closeBg.on('pointerdown', () => { this.scene.stop('TheoryScene'); data.onClose() })

    // Small ✕ in top-right (desktop convenience)
    const closeBtn = this.add
      .text(cx + panelW / 2 - 14, cy - panelH / 2 + 14, '✕', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '20px',
        color: '#64748b',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })

    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#f1f5f9' }))
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#64748b' }))
    closeBtn.on('pointerdown', () => {
      this.scene.stop('TheoryScene')
      data.onClose()
    })

    const left = cx - panelW / 2 + 28
    let y = cy - panelH / 2 + 22

    // Title + subtitle
    this.add.text(left, y, `📖  ${theory.title}`, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '22px',
      color: '#38bdf8',
      fontStyle: 'bold',
    })
    y += 30
    this.add.text(left, y, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '13px',
      color: '#64748b',
    })
    y += 26

    // Separator
    const sepGfx = this.add.graphics()
    sepGfx.lineStyle(1, 0x1e3a5f, 1)
    sepGfx.lineBetween(left, y, left + panelW - 56, y)
    y += 14

    // Concept
    this.add.text(left, y, theory.concept, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#cbd5e1',
      wordWrap: { width: panelW - 56 },
      lineSpacing: 4,
    })
    y += 62

    // Formula box
    const fboxH = 56
    this.add.rectangle(cx, y + fboxH / 2, panelW - 56, fboxH, 0x0c2233).setStrokeStyle(1, 0x0ea5e9)
    this.add.text(cx, y + 10, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '15px',
      color: '#7dd3fc',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    this.add.text(cx, y + 34, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '11px',
      color: '#475569',
    }).setOrigin(0.5, 0)
    y += fboxH + 14

    // Example
    this.add.text(left, y, '💡 Ejemplo', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '12px',
      color: '#f59e0b',
      fontStyle: 'bold',
    })
    y += 18
    this.add.text(left, y, theory.example, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      color: '#fde68a',
      wordWrap: { width: panelW - 56 },
    })
    y += 28

    // Separator
    sepGfx.lineStyle(1, 0x1e3a5f, 1)
    sepGfx.lineBetween(left, y, left + panelW - 56, y)
    y += 12

    // Tips
    this.add.text(left, y, '✦ Pasos clave', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '12px',
      color: '#10b981',
      fontStyle: 'bold',
    })
    y += 18
    theory.tips.forEach((tip, i) => {
      this.add.text(left, y, `${i + 1}.  ${tip}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '13px',
        color: '#94a3b8',
        wordWrap: { width: panelW - 56 },
      })
      y += 22
    })
  }
}
