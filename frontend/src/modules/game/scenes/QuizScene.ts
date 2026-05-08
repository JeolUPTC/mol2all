import Phaser from 'phaser'
import { gameEventBus } from '../bridge/gameEventBus'
import type { GameQuestion } from '../services/questions.service'
import { chemFormat } from '../utils/chemFormat'
import { renderChemLine, renderChemWrapped } from '../utils/renderChemText'

interface QuizSceneData {
  question: GameQuestion
  onAnswer: (isCorrect: boolean, timeSpent: number) => void
}

export class QuizScene extends Phaser.Scene {
  private onAnswer?: (isCorrect: boolean, timeSpent: number) => void
  private startTime = 0
  private numpadValue = ''
  private numpadDisplay?: Phaser.GameObjects.Text
  private answered = false

  constructor() {
    super({ key: 'QuizScene' })
  }

  init(data: QuizSceneData) {
    this.onAnswer = data.onAnswer
    this.startTime = Date.now()
    this.numpadValue = ''
    this.numpadDisplay = undefined
    this.answered = false

    const { type } = data.question
    if (type === 'MULTIPLE_CHOICE' || type === 'EQUATION_BALANCE' || type === 'MATCH_PAIRS') {
      this.renderMCQuestion(data.question)
    } else if (type === 'NUMERIC_INPUT') {
      this.renderNumericQuestion(data.question)
    }
  }

  // ── Multiple choice / equation balance ────────────────────────────────────

  private renderMCQuestion(q: GameQuestion) {
    const { width, height } = this.cameras.main
    const cx = width / 2
    // On mobile the canvas is scaled down — compensate with larger fonts
    const m = window.innerWidth < 900 ? 1.45 : 1
    const panelW = Math.min(720, width - 20)
    const STEM_FONT = Math.round(28 * m)
    const STEM_MAX_W = panelW - 56
    const BTN_H = Math.round(60 * m)
    const BTN_GAP = 10
    const LINE_SPACING = 10
    const MARGIN = 12

    // ── Accurate stem height via measure-only pass ────────────────────────────
    const BADGE_H = 36
    const STEM_PAD = 18
    const stemTop = MARGIN + BADGE_H
    const stemH = renderChemWrapped(
      this, cx, stemTop, chemFormat(q.stem),
      STEM_FONT, '#f1f5f9', STEM_MAX_W, 'Exo 2, system-ui', true, LINE_SPACING, true,
    )

    // ── Background dim ────────────────────────────────────────────────────────
    this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.82)

    // ── Upper panel: badge + stem ─────────────────────────────────────────────
    const upperH = BADGE_H + stemH + STEM_PAD
    const upperY = MARGIN + upperH / 2

    const upperPanel = this.add.rectangle(cx, upperY, panelW, upperH, 0x1e293b)
    upperPanel.setStrokeStyle(2, 0x0ea5e9)

    // Balancing: no tools. Molar mass: both. Everything else: calculator only.
    if (q.topic !== 'balancing') {
      this.addToolButtons(cx, upperY, panelW, upperH, false, q.topic === 'molar_mass')
    }

    const badgeLabel = q.type === 'EQUATION_BALANCE' ? '⚗ Ecuación química' : '❓ Pregunta'
    this.add
      .text(cx, MARGIN + 16, badgeLabel, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: `${Math.round(11 * m)}px`,
        color: '#7dd3fc',
        backgroundColor: '#0c2233',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)

    renderChemWrapped(
      this, cx, stemTop, chemFormat(q.stem),
      STEM_FONT, '#f1f5f9', STEM_MAX_W, 'Exo 2, system-ui', true, LINE_SPACING,
    )

    // ── Lower panel: 2×2 option buttons ──────────────────────────────────────
    const BTN_PAD = 10
    const lowerH = BTN_PAD + BTN_H * 2 + BTN_GAP + BTN_PAD
    const lowerY = height - MARGIN - lowerH / 2

    const lowerPanel = this.add.rectangle(cx, lowerY, panelW, lowerH, 0x1e293b)
    lowerPanel.setStrokeStyle(2, 0x0ea5e9)

    const row1Y = lowerY - lowerH / 2 + BTN_PAD + BTN_H / 2
    const row2Y = row1Y + BTN_H + BTN_GAP

    // Feedback verdict goes in the gap between the two panels
    const feedbackY = (MARGIN + upperH + lowerY - lowerH / 2) / 2

    const options = q.options ?? []
    const btnW = Math.min(310, (panelW - 48) / 2 - 6)

    options.forEach((opt, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = cx + (col === 0 ? -(btnW / 2 + 6) : btnW / 2 + 6)
      const y = row === 0 ? row1Y : row2Y

      const bg = this.add
        .rectangle(x, y, btnW, BTN_H, 0x2d3f55)
        .setInteractive({ useHandCursor: true })

      renderChemLine(this, x, y, chemFormat(opt.text), Math.round(20 * m), '#ffffff', 'Exo 2, system-ui', true)

      bg.on('pointerover', () => bg.setFillStyle(0x0369a1))
      bg.on('pointerout',  () => bg.setFillStyle(0x2d3f55))
      bg.on('pointerdown', () => {
        if (this.answered) return
        this.answered = true

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000)
        const correct = q.correctAnswer as { id: string }
        const isCorrect = opt.id === correct.id

        bg.setFillStyle(isCorrect ? 0x065f46 : 0x7f1d1d)
        gameEventBus.emit('answer:submitted', { questionId: 'generated', isCorrect, timeSpent })
        this.showFeedback(isCorrect, cx, feedbackY, q.explanation, () => {
          this.onAnswer?.(isCorrect, timeSpent)
        })
      })
    })
  }

  // ── Numeric input — Phaser-native calculator pad ──────────────────────────

  private renderNumericQuestion(q: GameQuestion) {
    const { width, height } = this.cameras.main
    const cx = width / 2
    const m = window.innerWidth < 900 ? 1.45 : 1
    const panelW = Math.min(580, width - 40)
    const panelH = height - 20
    const panelTop = (height - panelH) / 2  // = 10

    this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.80)

    const panel = this.add.rectangle(cx, height / 2, panelW, panelH, 0x1e293b)
    panel.setStrokeStyle(2, 0x0ea5e9)

    if (q.topic !== 'balancing') {
      this.addToolButtons(cx, height / 2, panelW, panelH, true, q.topic === 'molar_mass')
    }

    // Stem — renderChemWrapped gives crisp subscripts at proper sizes
    const STEM_FONT = Math.round(30 * m)
    const LINE_SPACING = 8
    const stemTop = panelTop + 22
    const stemH = renderChemWrapped(
      this, cx, stemTop, chemFormat(q.stem),
      STEM_FONT, '#f1f5f9', panelW - 60, 'Exo 2, system-ui', true, LINE_SPACING,
    )

    // Value display — flows below stem
    const displayY = stemTop + stemH + 22
    const displayBg = this.add.rectangle(cx, displayY, 230, 52, 0x0f172a)
    displayBg.setStrokeStyle(2, 0x38bdf8)

    this.numpadDisplay = this.add
      .text(cx, displayY, '0', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '28px',
        color: '#38bdf8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    // Numpad — flows below display
    const rows: string[][] = [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
      ['.', '0', '⌫'],
    ]

    const btnW = 72
    const btnH = 46
    const gapX = 10
    const gapY = 10
    const colSpacing = btnW + gapX
    const leftX = cx - colSpacing
    const firstRowY = displayY + 26 + 14 + btnH / 2   // display bottom + gap + center

    rows.forEach((row, ri) => {
      row.forEach((key, ci) => {
        const bx = leftX + ci * colSpacing
        const by = firstRowY + ri * (btnH + gapY)
        this.makeNumpadBtn(bx, by, btnW, btnH, key)
      })
    })

    // Confirm button
    const confirmW = 3 * btnW + 2 * gapX
    const confirmY = firstRowY + 4 * (btnH + gapY) + 2
    const confirmBg = this.add
      .rectangle(cx, confirmY, confirmW, 50, 0x0284c7)
      .setInteractive({ useHandCursor: true })

    const confirmTxt = this.add
      .text(cx, confirmY, '✓  Confirmar', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    confirmBg.on('pointerover', () => confirmBg.setFillStyle(0x0ea5e9))
    confirmBg.on('pointerout', () => confirmBg.setFillStyle(0x0284c7))
    confirmBg.on('pointerdown', () => {
      if (this.answered) return
      const val = parseFloat(this.numpadValue)
      if (isNaN(val)) return

      this.answered = true
      confirmBg.disableInteractive()
      confirmBg.setFillStyle(0x0c4a6e)
      confirmTxt.setStyle({ color: '#64748b' })

      const timeSpent = Math.floor((Date.now() - this.startTime) / 1000)
      const ca = q.correctAnswer as { value: number; tolerance: number }
      const isCorrect = Math.abs(val - ca.value) <= ca.tolerance

      gameEventBus.emit('answer:submitted', { questionId: 'generated', isCorrect, timeSpent })

      if (isCorrect) {
        this.showResultText(true, q.explanation, cx, confirmY + 64)
        this.time.delayedCall(1200, () => this.onAnswer?.(isCorrect, timeSpent))
      } else {
        this.showWrongFeedbackOverlay(q.explanation, () => this.onAnswer?.(isCorrect, timeSpent))
      }
    })
  }

  private makeNumpadBtn(x: number, y: number, w: number, h: number, key: string) {
    const isOp = key === '⌫' || key === '.'

    const bg = this.add
      .rectangle(x, y, w, h, isOp ? 0x1e3a5f : 0x334155)
      .setInteractive({ useHandCursor: true })

    this.add
      .text(x, y, key, {
        fontFamily: key === '⌫' ? 'system-ui' : 'JetBrains Mono, monospace',
        fontSize: '22px',
        color: isOp ? '#7dd3fc' : '#f1f5f9',
      })
      .setOrigin(0.5)

    bg.on('pointerover', () => bg.setFillStyle(isOp ? 0x075985 : 0x475569))
    bg.on('pointerout', () => bg.setFillStyle(isOp ? 0x1e3a5f : 0x334155))

    bg.on('pointerdown', () => {
      if (this.answered) return
      if (key === '⌫') {
        this.numpadValue = this.numpadValue.slice(0, -1)
      } else if (key === '.') {
        if (!this.numpadValue.includes('.')) this.numpadValue += '.'
      } else {
        if (this.numpadValue.length < 12) this.numpadValue += key
      }
      this.numpadDisplay?.setText(this.numpadValue || '0')
    })
  }

  // ── Tool buttons (calculator + periodic table) ───────────────────────────

  private addToolButtons(
    cx: number, cy: number, panelW: number, panelH: number,
    isNumeric: boolean, showPT = true,
  ) {
    const btnY = cy - panelH / 2 + 14

    const calcBtn = this.add
      .text(cx + panelW / 2 - 14, btnY, '🧮', {
        fontFamily: 'system-ui',
        fontSize: '17px',
        color: '#7dd3fc',
        backgroundColor: '#0c2233',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
    calcBtn.on('pointerover', () => calcBtn.setStyle({ backgroundColor: '#0e3a55' }))
    calcBtn.on('pointerout',  () => calcBtn.setStyle({ backgroundColor: '#0c2233' }))
    calcBtn.on('pointerdown', () => {
      if (this.answered) return
      const onInsert = isNumeric
        ? (v: number) => {
            this.numpadValue = String(v)
            this.numpadDisplay?.setText(this.numpadValue)
          }
        : undefined
      this.scene.launch('CalculatorScene', { onInsert, showPT })
    })

    if (!showPT) return

    const ptBtn = this.add
      .text(cx + panelW / 2 - 46, btnY, '⚛', {
        fontFamily: 'system-ui',
        fontSize: '17px',
        color: '#a78bfa',
        backgroundColor: '#1e1a40',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
    ptBtn.on('pointerover', () => ptBtn.setStyle({ backgroundColor: '#2d1f6e' }))
    ptBtn.on('pointerout',  () => ptBtn.setStyle({ backgroundColor: '#1e1a40' }))
    ptBtn.on('pointerdown', () => {
      if (this.answered) return
      this.scene.launch('PeriodicTableScene', {})
    })
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  private showFeedback(
    isCorrect: boolean,
    x: number,
    y: number,
    explanation: string,
    onDone: () => void,
  ) {
    this.add
      .text(x, y, isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '18px',
        color: isCorrect ? '#10b981' : '#ef4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    if (isCorrect) {
      this.time.delayedCall(1200, onDone)
      return
    }
    this.showWrongFeedbackOverlay(explanation, onDone)
  }

  private showWrongFeedbackOverlay(explanation: string, onDone: () => void) {
    const { width, height } = this.cameras.main
    const cx = width / 2
    const overlayH = Math.round(height * 0.33)
    const overlayY = height - 8 - overlayH / 2

    // Panel
    this.add
      .rectangle(cx, overlayY, width - 14, overlayH, 0x0a0303)
      .setStrokeStyle(2, 0xef4444)
      .setDepth(18)

    // Verdict
    this.add
      .text(cx, overlayY - overlayH / 2 + 22, '✗  Respuesta incorrecta', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '16px',
        color: '#ef4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(19)

    // Explanation
    if (explanation) {
      this.add
        .text(cx, overlayY - 8, chemFormat(explanation), {
          fontFamily: 'Exo 2, system-ui',
          fontSize: '13px',
          color: '#cbd5e1',
          wordWrap: { width: width - 56 },
          align: 'center',
          lineSpacing: 4,
        })
        .setOrigin(0.5)
        .setDepth(19)
    }

    // Continue button
    const btnY = overlayY + overlayH / 2 - 24
    const btn = this.add
      .rectangle(cx, btnY, 178, 40, 0x0284c7)
      .setInteractive({ useHandCursor: true })
      .setDepth(19)
    this.add
      .text(cx, btnY, '▶  Continuar', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20)
    btn.on('pointerover', () => btn.setFillStyle(0x0ea5e9))
    btn.on('pointerout',  () => btn.setFillStyle(0x0284c7))
    btn.on('pointerdown', () => onDone())
  }

  private showResultText(isCorrect: boolean, explanation: string, x: number, y: number) {
    const { width } = this.cameras.main
    this.add
      .text(x, y, isCorrect ? '✓ ¡Correcto!' : `✗ Incorrecto — ${chemFormat(explanation)}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '16px',
        color: isCorrect ? '#10b981' : '#ef4444',
        wordWrap: { width: Math.min(480, width - 60) },
        align: 'center',
      })
      .setOrigin(0.5)
  }

  shutdown() {
    // No HTML overlays to clean up — numpad is Phaser-native
    this.numpadValue = ''
    this.numpadDisplay = undefined
    this.answered = false
  }
}
