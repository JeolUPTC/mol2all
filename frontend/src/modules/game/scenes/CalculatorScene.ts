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

    const hasPT      = this.showPT
    const closeBtnH  = 40
    const baseH      = data.onInsert ? (hasPT ? 430 : 390) : (hasPT ? 408 : 368)
    const naturalH   = baseH + closeBtnH + GAP
    const naturalW   = 296

    // Scale so the panel always fits inside the canvas with 8px margin
    const s      = Math.max(0.6, Math.min(1, (height - 16) / naturalH, (width - 16) / naturalW))
    const panelW = Math.round(naturalW * s)
    const panelH = Math.round(naturalH * s)

    // Center horizontally on mobile; shift right on desktop so quiz is visible
    const isMobile = width < 600
    const cx = isMobile
      ? width / 2
      : Math.min(width / 2 + 200, width - panelW / 2 - 8)
    const cy = Math.round(Math.min(height / 2, height - panelH / 2 - 8))

    // Full-screen dim so user knows calculator is a modal
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)

    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x0f172a)
    panel.setStrokeStyle(2, 0x38bdf8)

    // ── Header ──────────────────────────────────────────────────────────
    this.add.text(cx - panelW / 2 + 12, cy - panelH / 2 + 10, '🧮 Calculadora', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#38bdf8',
      fontStyle: 'bold',
    })

    // Small ✕ in top-right (kept for desktop mouse users)
    const closeSmall = this.add
      .text(cx + panelW / 2 - 12, cy - panelH / 2 + 10, '✕', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '16px',
        color: '#64748b',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
    closeSmall.on('pointerover', () => closeSmall.setStyle({ color: '#f1f5f9' }))
    closeSmall.on('pointerout', () => closeSmall.setStyle({ color: '#64748b' }))
    closeSmall.on('pointerdown', () => this.scene.stop('CalculatorScene'))

    // ── Display ──────────────────────────────────────────────────────────
    const dispY = cy - panelH / 2 + 58
    const dispW = panelW - 20
    this.add.rectangle(cx, dispY, dispW, 60, 0x020617).setStrokeStyle(1, 0x1e3a5f)

    this.exprText = this.add
      .text(cx + dispW / 2 - 8, dispY - 14, '0', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '14px',
        color: '#64748b',
        wordWrap: { width: dispW - 16 },
        align: 'right',
      })
      .setOrigin(1, 0.5)

    this.resultText = this.add
      .text(cx + dispW / 2 - 8, dispY + 14, '', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '20px',
        color: '#38bdf8',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)

    // ── Button grid — sizes scale with panel ──────────────────────────────
    const btnW = Math.round(BTN_W * s)
    const btnH = Math.round(BTN_H * s)
    const gap  = Math.max(2, Math.round(GAP * s))

    const gridW      = 4 * btnW + 3 * gap
    const gridStartX = cx - gridW / 2 + btnW / 2
    const gridStartY = cy - panelH / 2 + Math.round(108 * s)

    ROWS.forEach((row, ri) => {
      row.forEach((key, ci) => {
        const bx = gridStartX + ci * (btnW + gap)
        const by = gridStartY + ri * (btnH + gap)
        this.makeBtn(bx, by, key, btnW, btnH)
      })
    })

    // ── Periodic table shortcut ───────────────────────────────────────────
    const ptY = gridStartY + 5 * (btnH + gap) + 8
    if (this.showPT) {
      const ptBtn = this.add
        .text(cx, ptY, '⚛  Tabla periódica', {
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

    // ── Insert result into answer ─────────────────────────────────────────
    if (this.onInsert) {
      const insY = this.showPT ? ptY + 40 : ptY
      const insBtn = this.add
        .text(cx, insY, '→  Usar resultado como respuesta', {
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

    // ── Large close button at bottom (touch-friendly) ─────────────────────
    const closeBtnY = cy + panelH / 2 - closeBtnH / 2 - 6
    const closeBg = this.add
      .rectangle(cx, closeBtnY, panelW - 16, closeBtnH, 0x1e3a5f)
      .setInteractive({ useHandCursor: true })
    this.add.text(cx, closeBtnY, '✕  Cerrar calculadora', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '15px',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    closeBg.on('pointerover', () => closeBg.setFillStyle(0x075985))
    closeBg.on('pointerout',  () => closeBg.setFillStyle(0x1e3a5f))
    closeBg.on('pointerdown', () => this.scene.stop('CalculatorScene'))
  }

  // ── Button factory ────────────────────────────────────────────────────────

  private makeBtn(x: number, y: number, key: string, w = BTN_W, h = BTN_H) {
    const isOp = ['÷', '×', '−', '+', '=', 'C', '⌫', '(', ')'].includes(key)
    const isEq = key === '='
    const bgColor = isEq ? 0x0284c7 : isOp ? 0x1e3a5f : 0x1e293b
    const fontSize = Math.max(10, Math.round(16 * (w / BTN_W)))

    const bg = this.add
      .rectangle(x, y, w, h, bgColor)
      .setInteractive({ useHandCursor: true })
    this.add.text(x, y, key, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: `${fontSize}px`,
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
      if (this.justEvaluated && /[\d.]/.test(key)) {
        this.expr = key
      } else if (this.justEvaluated && /[+\-×÷]/.test(key)) {
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
