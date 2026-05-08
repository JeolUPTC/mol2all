import Phaser from 'phaser'

interface CalcSceneData {
  onInsert?: (value: number) => void
  showPT?: boolean
}

const BTN_W = 54
const BTN_H = 34
const GAP = 4

const ROWS: string[][] = [
  ['C', '(', ')', '⌫'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['.', '0', '=', '+'],
]

function safeEval(expr: string): number {
  const js = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  if (!/^[\d\s+\-*/.()\s]+$/.test(js)) throw new Error('invalid')
  return Function(`"use strict";return(${js})`)() as number
}

export class CalculatorScene extends Phaser.Scene {
  private expr = ''
  private lastResult = 0
  private justEvaluated = false
  private exprText!: Phaser.GameObjects.Text
  private resultText!: Phaser.GameObjects.Text
  private onInsert?: (v: number) => void
  private showPT = false

  constructor() {
    super({ key: 'CalculatorScene' })
  }

  init(data: CalcSceneData) {
    this.expr = ''
    this.lastResult = 0
    this.justEvaluated = false
    this.onInsert = data.onInsert
    this.showPT = data.showPT ?? false

    const { width, height } = this.cameras.main
    const panelW = 296
    const hasPT = this.showPT
    const panelH = data.onInsert
      ? (hasPT ? 430 : 390)
      : (hasPT ? 408 : 368)
    const cx = width / 2 + 200   // right-of-center so question stays visible
    const cy = height / 2

    // Constraint to canvas
    const px = Math.min(cx, width - panelW / 2 - 8)
    const py = Math.min(cy, height - panelH / 2 - 8)

    // Backdrop (dim only where calculator sits)
    this.add.rectangle(px, py, panelW, panelH, 0x000000, 0.6)

    const panel = this.add.rectangle(px, py, panelW, panelH, 0x0f172a)
    panel.setStrokeStyle(2, 0x38bdf8)

    // ── Header ──────────────────────────────────────────────────────────
    this.add.text(px - panelW / 2 + 12, py - panelH / 2 + 10, '🧮 Calculadora', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#38bdf8',
      fontStyle: 'bold',
    })

    const closeBtn = this.add
      .text(px + panelW / 2 - 12, py - panelH / 2 + 10, '✕', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '16px',
        color: '#64748b',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#f1f5f9' }))
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#64748b' }))
    closeBtn.on('pointerdown', () => this.scene.stop('CalculatorScene'))

    // ── Display ──────────────────────────────────────────────────────────
    const dispY = py - panelH / 2 + 58
    const dispW = panelW - 20
    this.add.rectangle(px, dispY, dispW, 60, 0x020617).setStrokeStyle(1, 0x1e3a5f)

    this.exprText = this.add
      .text(px + dispW / 2 - 8, dispY - 14, '0', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '14px',
        color: '#64748b',
        wordWrap: { width: dispW - 16 },
        align: 'right',
      })
      .setOrigin(1, 0.5)

    this.resultText = this.add
      .text(px + dispW / 2 - 8, dispY + 14, '', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '20px',
        color: '#38bdf8',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)

    // ── Button grid ───────────────────────────────────────────────────────
    const gridW = 4 * BTN_W + 3 * GAP
    const gridStartX = px - gridW / 2 + BTN_W / 2
    const gridStartY = py - panelH / 2 + 108

    ROWS.forEach((row, ri) => {
      row.forEach((key, ci) => {
        const bx = gridStartX + ci * (BTN_W + GAP)
        const by = gridStartY + ri * (BTN_H + GAP)
        this.makeBtn(bx, by, key)
      })
    })

    // ── Periodic table shortcut (molar_mass only) ─────────────────────────
    const ptY = gridStartY + 5 * (BTN_H + GAP) + 8
    if (this.showPT) {
      const ptBtn = this.add
        .text(px, ptY, '⚛  Tabla periódica', {
          fontFamily: 'Exo 2, system-ui',
          fontSize: '13px',
          color: '#a78bfa',
          backgroundColor: '#1e1a40',
          padding: { x: 14, y: 7 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      ptBtn.on('pointerover', () => ptBtn.setStyle({ backgroundColor: '#2d1f6e' }))
      ptBtn.on('pointerout', () => ptBtn.setStyle({ backgroundColor: '#1e1a40' }))
      ptBtn.on('pointerdown', () => {
        this.scene.launch('PeriodicTableScene', {
          onElementSelect: (mass: number) => {
            this.insertMass(mass)
            this.scene.stop('PeriodicTableScene')
          },
        })
      })
    }

    // ── Insert result into answer (NUMERIC_INPUT only) ────────────────────
    if (this.onInsert) {
      const insY = this.showPT ? ptY + 40 : ptY
      const insBtn = this.add
        .text(px, insY, '→  Usar resultado como respuesta', {
          fontFamily: 'Exo 2, system-ui',
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#0284c7',
          padding: { x: 14, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      insBtn.on('pointerover', () => insBtn.setStyle({ backgroundColor: '#0ea5e9' }))
      insBtn.on('pointerout', () => insBtn.setStyle({ backgroundColor: '#0284c7' }))
      insBtn.on('pointerdown', () => {
        if (this.justEvaluated) {
          this.onInsert!(this.lastResult)
          this.scene.stop('CalculatorScene')
        }
      })
    }
  }

  // ── Button factory ────────────────────────────────────────────────────────

  private makeBtn(x: number, y: number, key: string) {
    const isOp = ['÷', '×', '−', '+', '=', 'C', '⌫', '(', ')'].includes(key)
    const isEq = key === '='
    const bgColor = isEq ? 0x0284c7 : isOp ? 0x1e3a5f : 0x1e293b

    const bg = this.add
      .rectangle(x, y, BTN_W, BTN_H, bgColor)
      .setInteractive({ useHandCursor: true })
    this.add.text(x, y, key, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '16px',
      color: isEq ? '#ffffff' : isOp ? '#7dd3fc' : '#f1f5f9',
      fontStyle: isEq ? 'bold' : 'normal',
    }).setOrigin(0.5)

    const hoverColor = isEq ? 0x0ea5e9 : isOp ? 0x075985 : 0x334155
    bg.on('pointerover', () => bg.setFillStyle(hoverColor))
    bg.on('pointerout', () => bg.setFillStyle(bgColor))
    bg.on('pointerdown', () => this.press(key))
  }

  // ── Logic ──────────────────────────────────────────────────────────────────

  private press(key: string) {
    if (key === 'C') {
      this.expr = ''
      this.lastResult = 0
      this.justEvaluated = false
    } else if (key === '⌫') {
      this.expr = this.expr.slice(0, -1)
      this.justEvaluated = false
    } else if (key === '=') {
      this.evaluate()
      return
    } else {
      // After evaluation, a digit starts a new expression; an operator continues
      if (this.justEvaluated && /[\d.]/.test(key)) {
        this.expr = key
      } else if (this.justEvaluated && /[+\-×÷]/.test(key)) {
        // Continue from last result
        this.expr = String(this.lastResult) + key
      } else {
        this.expr += key
      }
      this.justEvaluated = false
    }
    this.updateDisplay()
  }

  private evaluate() {
    try {
      const result = safeEval(this.expr)
      if (!isFinite(result)) throw new Error('infinite')
      this.lastResult = parseFloat(result.toFixed(6))
      this.justEvaluated = true
      this.updateDisplay()
    } catch {
      this.exprText.setText('Error')
      this.resultText.setText('')
      this.expr = ''
      this.justEvaluated = false
    }
  }

  /** Called by PeriodicTableScene when user clicks an element */
  insertMass(mass: number) {
    if (this.justEvaluated) {
      this.expr = String(mass)
    } else {
      this.expr += String(mass)
    }
    this.justEvaluated = false
    this.updateDisplay()
  }

  private updateDisplay() {
    this.exprText.setText(this.expr || '0')
    this.resultText.setText(this.justEvaluated ? `= ${this.lastResult}` : '')
  }
}
