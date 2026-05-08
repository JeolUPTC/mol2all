import Phaser from 'phaser'
import { questionsService, type GameQuestion, type LevelTopic } from '../services/questions.service'
import { THEORY, DEFAULT_THEORY } from '../data/theory.data'

interface GameSceneData {
  topic?: LevelTopic
  difficulty?: 1 | 2 | 3
  totalQuestions?: number
  levelName?: string
  levelOrder?: number
}

const TOPIC_LABEL: Record<string, string> = {
  molar_mass: 'Masa Molar',
  balancing: 'Balanceo de Ecuaciones',
  stoichiometry: 'Estequiometría',
  limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento',
}

export class GameScene extends Phaser.Scene {
  private topic: LevelTopic = 'molar_mass'
  private difficulty: 1 | 2 | 3 = 1
  private totalQuestions = 5
  private levelName = 'Nivel 1'
  private levelOrder = 1

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: GameSceneData) {
    this.topic = data.topic ?? 'molar_mass'
    this.difficulty = data.difficulty ?? 1
    this.totalQuestions = data.totalQuestions ?? 5
    this.levelName = data.levelName ?? 'Nivel 1'
    this.levelOrder = data.levelOrder ?? 1
  }

  async create() {
    const { width, height } = this.cameras.main

    // Full background
    this.add.rectangle(width / 2, height / 2, width, height, 0x060f1e)

    const isMobile = width < 720 || height < 380
    if (isMobile) {
      await this.layoutMobile(width, height)
    } else {
      await this.layoutDesktop(width, height)
    }
  }

  // ── DESKTOP: two-panel layout ─────────────────────────────────────────────

  private async layoutDesktop(W: number, H: number) {
    const theory = THEORY[this.topic] ?? DEFAULT_THEORY

    // ── LEFT: theory sidebar (28% of width, full height) ──────────────────
    const cardW = Math.min(420, Math.round(W * 0.28))
    const cardH = H - 2
    const cardX = cardW / 2 + 1
    const cardY = H / 2

    // Card background + border
    this.add.rectangle(cardX, cardY, cardW, cardH, 0x080f1e).setStrokeStyle(2, 0x0ea5e9, 0.9)

    // Subtle inner top accent strip
    this.add.rectangle(cardX, 3, cardW, 4, 0x0ea5e9, 0.7)

    const tPad = 24
    const textW = cardW - tPad * 2
    // Start at y=64 to clear the React ← Salir button overlay
    let y = 64

    // Title
    this.add.text(cardX, y, `📖  ${theory.title}`, {
      fontFamily: 'Exo 2, system-ui', fontSize: '22px',
      color: '#38bdf8', fontStyle: 'bold',
      wordWrap: { width: textW }, align: 'center',
    }).setOrigin(0.5, 0)
    y += 40

    // Subtitle chip
    const subChip = this.add.text(cardX, y, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui', fontSize: '13px',
      color: '#64748b', wordWrap: { width: textW }, align: 'center',
    }).setOrigin(0.5, 0)
    y += subChip.height + 18

    // Divider
    this.drawDivider(cardX - textW / 2, y, textW)
    y += 12

    // Concept (max 3 lines to save space)
    const conceptText = this.add.text(cardX, y, theory.concept, {
      fontFamily: 'Exo 2, system-ui', fontSize: '15px',
      color: '#94a3b8', wordWrap: { width: textW }, lineSpacing: 5,
      align: 'center',
    }).setOrigin(0.5, 0)
    y += Math.min(conceptText.height, 90) + 16

    // Formula box — most prominent element on left
    const fBoxH = 88
    this.add.rectangle(cardX, y + fBoxH / 2, cardW - 24, fBoxH, 0x0c2233).setStrokeStyle(2, 0x0ea5e9)
    this.add.text(cardX, y + 14, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '19px',
      color: '#7dd3fc', fontStyle: 'bold',
      wordWrap: { width: textW - 8 }, align: 'center',
    }).setOrigin(0.5, 0)
    this.add.text(cardX, y + fBoxH - 20, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '13px', color: '#334155',
    }).setOrigin(0.5, 0)
    y += fBoxH + 14

    // Example
    this.add.text(cardX, y, `💡  ${theory.example}`, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '14px',
      color: '#fde68a', wordWrap: { width: textW }, align: 'center',
    }).setOrigin(0.5, 0)
    y += 46

    // Divider
    this.drawDivider(cardX - textW / 2, y, textW)
    y += 12

    // Key steps
    this.add.text(cardX, y, '✦  Pasos clave', {
      fontFamily: 'Exo 2, system-ui', fontSize: '14px',
      color: '#10b981', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5, 0)
    y += 24

    theory.tips.forEach((tip, i) => {
      this.add.text(cardX - textW / 2, y, `${i + 1}.`, {
        fontFamily: 'Exo 2, system-ui', fontSize: '14px', color: '#38bdf8', fontStyle: 'bold',
      })
      this.add.text(cardX - textW / 2 + 22, y, tip, {
        fontFamily: 'Exo 2, system-ui', fontSize: '14px',
        color: '#94a3b8', wordWrap: { width: textW - 22 },
      })
      y += 26
    })

    // ── RIGHT: level briefing (remaining 72%) ────────────────────────────
    const rStart = cardW + 2
    const rW = W - rStart
    const rCx = rStart + rW / 2

    // Subtle vertical separator
    this.add.rectangle(rStart, H / 2, 1, H, 0x1e3a5f, 0.8)

    // ── SECTION A: Level identity (top 40% of height) ────────────────────
    const sectionAH = Math.round(H * 0.40)

    // Background tint for section A
    this.add.rectangle(rCx, sectionAH / 2, rW, sectionAH, 0x0a1628, 0.7)
    this.add.rectangle(rCx, sectionAH, rW, 2, 0x0ea5e9, 0.3)

    // Level name — dominant text, scales with available height
    const nameFontSize = Math.round(Math.min(64, H * 0.083))
    this.add.text(rCx, sectionAH * 0.28, this.levelName, {
      fontFamily: 'Exo 2, system-ui', fontSize: `${nameFontSize}px`,
      color: '#f1f9ff', fontStyle: 'bold',
      wordWrap: { width: rW - 48 }, align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 18, fill: true },
    }).setOrigin(0.5, 0.5)

    // Topic chip + difficulty stars
    const topicLabel = TOPIC_LABEL[this.topic] ?? this.topic
    const diffStars = '★'.repeat(this.difficulty) + '☆'.repeat(3 - this.difficulty)
    this.add.text(rCx, sectionAH * 0.72, `${topicLabel}   ${diffStars}`, {
      fontFamily: 'Exo 2, system-ui', fontSize: '20px',
      color: '#64748b', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5)

    // ── SECTION B: Loading status (middle 20%) ───────────────────────────
    const sectionBTop = sectionAH
    const sectionBH = Math.round(H * 0.20)
    const sectionBCy = sectionBTop + sectionBH / 2

    const loadingText = this.add.text(rCx, sectionBCy - 12, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui', fontSize: '22px', color: '#64748b',
    }).setOrigin(0.5)

    // Animated dots indicator
    const spinR = 10
    const spinY = sectionBCy + 22
    const spinner = this.add.graphics()
    this.tweens.add({
      targets: { a: 0 }, a: 360, duration: 900, repeat: -1,
      onUpdate: (tw) => {
        const a = (tw.targets[0] as { a: number }).a
        spinner.clear()
        spinner.lineStyle(3, 0x0ea5e9, 1)
        spinner.beginPath()
        spinner.arc(rCx, spinY, spinR, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 260))
        spinner.strokePath()
      },
    })

    let questions: GameQuestion[] = []
    let dots = ''
    const dotTimer = this.time.addEvent({
      delay: 350,
      callback: () => { dots = dots.length < 3 ? dots + '.' : ''; loadingText.setText(`Generando preguntas${dots}`) },
      repeat: -1,
    })

    try {
      questions = this.topic === 'mixed'
        ? await questionsService.generateMixed(this.totalQuestions)
        : await questionsService.generateBatch(this.topic, this.difficulty, this.totalQuestions)
    } catch { /* PlayScene handles empty */ }

    dotTimer.destroy()
    spinner.clear()

    loadingText.setText('✓  Preguntas listas')
    loadingText.setStyle({ color: '#10b981', fontSize: '24px' })

    // ── SECTION C: Action area (bottom 40%) ─────────────────────────────
    const sectionCTop = sectionAH + sectionBH
    const sectionCH = H - sectionCTop
    const sectionCCy = sectionCTop + sectionCH / 2

    // Play button — fills 82% of right panel width, tall and dominant
    const btnW = Math.min(rW - 40, 680)
    const btnH = Math.max(72, Math.round(sectionCH * 0.42))
    const btnY = sectionCTop + Math.round(sectionCH * 0.38)
    const btnFontSize = Math.round(Math.min(38, btnH * 0.46))

    // Button shadow
    this.add.rectangle(rCx + 6, btnY + 6, btnW, btnH, 0x012a55, 0.7)
    // Button glow halo
    this.add.rectangle(rCx, btnY, btnW + 10, btnH + 10, 0x0ea5e9, 0.18)
    // Button body
    const btnBg = this.add.rectangle(rCx, btnY, btnW, btnH, 0x0284c7).setInteractive({ useHandCursor: true })
    // Shine strip
    this.add.rectangle(rCx, btnY - btnH / 2 + 12, btnW - 12, 20, 0xffffff, 0.12)
    // Label
    this.add.text(rCx, btnY, '▶   ¡Jugar ahora!', {
      fontFamily: 'Exo 2, system-ui', fontSize: `${btnFontSize}px`,
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x0ea5e9))
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x0284c7))
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayScene', {
          questions, levelName: this.levelName,
          topic: this.topic, difficulty: this.difficulty, levelOrder: this.levelOrder,
        })
      })
    })

    // Hint below button
    this.add.text(rCx, sectionCCy + sectionCH * 0.3, '← Lee la teoría en el panel izquierdo antes de jugar', {
      fontFamily: 'Exo 2, system-ui', fontSize: '15px', color: '#334155',
    }).setOrigin(0.5)
  }

  // ── MOBILE: single-column ─────────────────────────────────────────────────

  private async layoutMobile(W: number, H: number) {
    const theory = THEORY[this.topic] ?? DEFAULT_THEORY
    const pad = 14

    // ── TOP STRIP: level identity ─────────────────────────────────────────
    const topH = Math.round(H * 0.24)
    this.add.rectangle(W / 2, topH / 2, W, topH, 0x0a1628).setStrokeStyle(1, 0x0ea5e9, 0.6)
    this.add.rectangle(W / 2, topH, W, 2, 0x0ea5e9, 0.4)

    const nameFontSize = Math.round(Math.min(32, H * 0.07))
    this.add.text(W / 2, topH * 0.35, this.levelName, {
      fontFamily: 'Exo 2, system-ui', fontSize: `${nameFontSize}px`,
      color: '#f1f9ff', fontStyle: 'bold',
      wordWrap: { width: W - 24 }, align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 8, fill: true },
    }).setOrigin(0.5, 0.5)

    const topicLabel = TOPIC_LABEL[this.topic] ?? this.topic
    this.add.text(W / 2, topH * 0.76, topicLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '16px', color: '#64748b', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5)

    // ── MIDDLE: formula card ──────────────────────────────────────────────
    const midTop = topH + pad
    const midH = Math.round(H * 0.36)
    const midCy = midTop + midH / 2

    this.add.rectangle(W / 2, midCy, W - pad * 2, midH - 4, 0x0c2233).setStrokeStyle(2, 0x0ea5e9)

    this.add.text(W / 2, midCy - midH * 0.28, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '17px',
      color: '#7dd3fc', fontStyle: 'bold',
      wordWrap: { width: W - pad * 3 }, align: 'center',
    }).setOrigin(0.5, 0.5)

    this.add.text(W / 2, midCy, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '13px', color: '#334155',
    }).setOrigin(0.5, 0.5)

    this.add.text(W / 2, midCy + midH * 0.28, `💡  ${theory.example}`, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '14px',
      color: '#fde68a', wordWrap: { width: W - pad * 3 }, align: 'center',
    }).setOrigin(0.5, 0.5)

    // ── LOADING STATUS ────────────────────────────────────────────────────
    const statusTop = midTop + midH + pad
    const statusH = Math.round(H * 0.12)
    const statusCy = statusTop + statusH / 2

    const loadingText = this.add.text(W / 2, statusCy, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui', fontSize: '16px', color: '#64748b',
    }).setOrigin(0.5)

    let questions: GameQuestion[] = []
    let dots = ''
    const dotTimer = this.time.addEvent({
      delay: 380,
      callback: () => { dots = dots.length < 3 ? dots + '.' : ''; loadingText.setText(`Generando preguntas${dots}`) },
      repeat: -1,
    })

    try {
      questions = this.topic === 'mixed'
        ? await questionsService.generateMixed(this.totalQuestions)
        : await questionsService.generateBatch(this.topic, this.difficulty, this.totalQuestions)
    } catch { /* PlayScene handles empty */ }

    dotTimer.destroy()
    loadingText.setText('✓  Preguntas listas')
    loadingText.setStyle({ color: '#10b981', fontSize: '18px' })

    // ── PLAY BUTTON — full width, bottom of screen ────────────────────────
    const btnH = Math.max(56, Math.round(H * 0.14))
    const btnW = W - pad * 2
    const btnY = H - pad - btnH / 2
    const btnFontSize = Math.round(Math.min(30, btnH * 0.46))

    this.add.rectangle(W / 2 + 5, btnY + 5, btnW, btnH, 0x012a55, 0.6)
    this.add.rectangle(W / 2, btnY, btnW + 8, btnH + 8, 0x0ea5e9, 0.15)
    const btnBg = this.add.rectangle(W / 2, btnY, btnW, btnH, 0x0284c7).setInteractive({ useHandCursor: true })
    this.add.text(W / 2, btnY, '▶   ¡Jugar ahora!', {
      fontFamily: 'Exo 2, system-ui', fontSize: `${btnFontSize}px`,
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x0ea5e9))
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x0284c7))
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayScene', {
          questions, levelName: this.levelName,
          topic: this.topic, difficulty: this.difficulty, levelOrder: this.levelOrder,
        })
      })
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private drawDivider(x: number, y: number, w: number) {
    const g = this.add.graphics()
    g.lineStyle(1, 0x1e3a5f, 1)
    g.lineBetween(x, y, x + w, y)
  }
}
