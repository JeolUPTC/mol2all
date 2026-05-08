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

    // Fondo
    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.96)

    // Layout porcentual
    const leftPanelW = width * 0.72
    const rightPanelW = width * 0.24
    const panelH = height * 0.92
    const margin = width * 0.02

    const leftX = margin
    const rightX = leftPanelW + margin * 2
    const topY = height * 0.04

    // Panel izquierdo
    this.add.rectangle(
      leftX + leftPanelW / 2,
      height / 2,
      leftPanelW,
      panelH,
      0x0f172a
    ).setStrokeStyle(2, 0x38bdf8)

    // Panel derecho
    this.add.rectangle(
      rightX + rightPanelW / 2,
      height / 2,
      rightPanelW,
      panelH,
      0x0b1120
    ).setStrokeStyle(2, 0x1d4ed8)

    // Botón salir
    const closeBtn = this.add
      .rectangle(90, 40, 120, 50, 0x1e293b)
      .setStrokeStyle(1, 0x64748b)
      .setInteractive({ useHandCursor: true })

    this.add.text(90, 40, '← Salir', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '24px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    closeBtn.on('pointerdown', () => {
      this.scene.stop('TheoryScene')
      data.onClose()
    })

    // -------------------------
    // PANEL IZQUIERDO CONTENIDO
    // -------------------------
    let y = topY + 20
    const leftPadding = leftX + 35
    const contentWidth = leftPanelW - 70

    // Título
    this.add.text(leftPadding, y, theory.title, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '34px',
      color: '#38bdf8',
      fontStyle: 'bold',
    })
    y += 55

    // Subtítulo
    this.add.text(leftPadding, y, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '20px',
      color: '#94a3b8',
    })
    y += 40

    // Línea divisoria
    const gfx = this.add.graphics()
    gfx.lineStyle(2, 0x1e3a5f, 1)
    gfx.lineBetween(leftPadding, y, leftPadding + contentWidth, y)
    y += 30

    // Concepto
    this.add.text(leftPadding, y, theory.concept, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '22px',
      color: '#e2e8f0',
      wordWrap: { width: contentWidth },
      lineSpacing: 10,
    })
    y += 140

    // Fórmula destacada
    const formulaBoxH = 120
    this.add.rectangle(
      leftX + leftPanelW / 2,
      y + formulaBoxH / 2,
      contentWidth,
      formulaBoxH,
      0x0c2233
    ).setStrokeStyle(2, 0x0ea5e9)

    this.add.text(leftX + leftPanelW / 2, y + 20, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '42px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0)

    this.add.text(leftX + leftPanelW / 2, y + 85, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '18px',
      color: '#94a3b8',
    }).setOrigin(0.5)

    y += formulaBoxH + 40

    // Ejemplo
    this.add.text(leftPadding, y, '💡 Ejemplo práctico', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '24px',
      color: '#f59e0b',
      fontStyle: 'bold',
    })
    y += 40

    this.add.text(leftPadding, y, theory.example, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '26px',
      color: '#fde68a',
      wordWrap: { width: contentWidth },
    })
    y += 70

    // Pasos
    this.add.text(leftPadding, y, '✦ Pasos clave', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '24px',
      color: '#10b981',
      fontStyle: 'bold',
    })
    y += 40

    theory.tips.forEach((tip, i) => {
      this.add.text(leftPadding, y, `${i + 1}. ${tip}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '20px',
        color: '#cbd5e1',
        wordWrap: { width: contentWidth },
        lineSpacing: 6,
      })
      y += 45
    })

    // -------------------------
    // PANEL DERECHO
    // -------------------------
    let ry = topY + 80
    const centerRight = rightX + rightPanelW / 2

    this.add.text(centerRight, ry, 'Introducción', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '24px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    ry += 90

    this.add.text(centerRight, ry, theory.title, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '20px',
      color: '#38bdf8',
      align: 'center',
      wordWrap: { width: rightPanelW - 30 },
    }).setOrigin(0.5)
    ry += 120

    this.add.text(centerRight, ry, '★★★', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '28px',
      color: '#f59e0b',
    }).setOrigin(0.5)
    ry += 100

    this.add.text(centerRight, ry, '✔ ¡Preguntas listas!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '22px',
      color: '#10b981',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Botón jugar
    const playY = height - 120

    const playBtn = this.add
      .rectangle(centerRight, playY, rightPanelW - 30, 90, 0x0ea5e9)
      .setStrokeStyle(2, 0x38bdf8)
      .setInteractive({ useHandCursor: true })

    this.add.text(centerRight, playY, '▶ ¡Jugar!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    playBtn.on('pointerdown', () => {
      this.scene.stop('TheoryScene')
      data.onClose()
    })
  }
}
