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
    this.add.rectangle(width / 2, height / 2, width, height, 0x060f1e)

    const isMobile = width < 720 || height < 380
    if (isMobile) {
      await this.layoutMobile(width, height)
    } else {
      await this.layoutDesktop(width, height)
    }
  }

  // ── DESKTOP: 70% theory left / 30% action right ───────────────────────────

  private async layoutDesktop(W: number, H: number) {
    const theory = THEORY[this.topic] ?? DEFAULT_THEORY

    // ── LEFT PANEL: 70% theory ────────────────────────────────────────────
    const lW = Math.round(W * 0.70)
    const lCx = lW / 2
    const pad = 36
    const textW = lW - pad * 2

    this.add.rectangle(lCx, H / 2, lW, H, 0x080f1e).setStrokeStyle(2, 0x0ea5e9, 0.8)
    this.add.rectangle(lCx, 3, lW, 5, 0x0ea5e9, 0.8)

    // y=68 clears the React ← Salir button
    let y = 68

    this.add.text(lCx, y, `📖  ${theory.title}`, {
      fontFamily: 'Exo 2, system-ui', fontSize: '28px',
      color: '#38bdf8', fontStyle: 'bold',
      wordWrap: { width: textW }, align: 'center',
    }).setOrigin(0.5, 0)
    y += 50

    const sub = this.add.text(lCx, y, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui', fontSize: '18px',
      color: '#475569', wordWrap: { width: textW }, align: 'center',
    }).setOrigin(0.5, 0)
    y += sub.height + 18

    this.drawDivider(lCx - textW / 2, y, textW)
    y += 18

    const conceptT = this.add.text(lCx, y, theory.concept, {
      fontFamily: 'Exo 2, system-ui', fontSize: '19px',
      color: '#94a3b8', wordWrap: { width: textW }, lineSpacing: 7, align: 'center',
    }).setOrigin(0.5, 0)
    y += Math.min(conceptT.height, 110) + 22

    // Formula box
    const fBoxH = 106
    this.add.rectangle(lCx, y + fBoxH / 2, lW - 48, fBoxH, 0x0c2233).setStrokeStyle(2, 0x0ea5e9)
    this.add.text(lCx, y + 18, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '26px',
      color: '#7dd3fc', fontStyle: 'bold',
      wordWrap: { width: textW - 8 }, align: 'center',
    }).setOrigin(0.5, 0)
    this.add.text(lCx, y + fBoxH - 24, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '15px', color: '#334155',
    }).setOrigin(0.5, 0)
    y += fBoxH + 20

    this.add.text(lCx, y, `💡  ${theory.example}`, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '18px',
      color: '#fde68a', wordWrap: { width: textW }, align: 'center',
    }).setOrigin(0.5, 0)
    y += 56

    this.drawDivider(lCx - textW / 2, y, textW)
    y += 18

    this.add.text(lCx, y, '✦  Pasos clave', {
      fontFamily: 'Exo 2, system-ui', fontSize: '18px',
      color: '#10b981', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    y += 32

    theory.tips.forEach((tip, i) => {
      this.add.text(lCx - textW / 2, y, `${i + 1}.`, {
        fontFamily: 'Exo 2, system-ui', fontSize: '17px', color: '#38bdf8', fontStyle: 'bold',
      })
      const tipT = this.add.text(lCx - textW / 2 + 28, y, tip, {
        fontFamily: 'Exo 2, system-ui', fontSize: '17px',
        color: '#94a3b8', wordWrap: { width: textW - 28 },
      })
      y += Math.max(tipT.height + 6, 32)
    })

    // ── RIGHT PANEL: 30% action ───────────────────────────────────────────
    const rStart = lW + 2
    const rW = W - rStart
    const rCx = rStart + rW / 2

    // Separator
    this.add.rectangle(rStart + 1, H / 2, 2, H, 0x1e3a5f, 0.9)

    // Level name — upper 45% of right panel
    const nameFontSize = Math.round(Math.min(46, rW * 0.1))
    this.add.text(rCx, Math.round(H * 0.22), this.levelName, {
      fontFamily: 'Exo 2, system-ui', fontSize: `${nameFontSize}px`,
      color: '#f1f9ff', fontStyle: 'bold',
      wordWrap: { width: rW - 24 }, align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 16, fill: true },
    }).setOrigin(0.5, 0.5)

    const topicLabel = TOPIC_LABEL[this.topic] ?? this.topic
    this.add.text(rCx, Math.round(H * 0.38), topicLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '19px',
      color: '#64748b', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5)

    const diffStars = '★'.repeat(this.difficulty) + '☆'.repeat(3 - this.difficulty)
    this.add.text(rCx, Math.round(H * 0.46), diffStars, {
      fontFamily: 'Exo 2, system-ui', fontSize: '24px', color: '#f59e0b',
    }).setOrigin(0.5, 0.5)

    this.drawDivider(rStart + 16, Math.round(H * 0.52), rW - 32)

    // Loading area — 52%–72% of height
    const loadingY = Math.round(H * 0.60)
    const loadingText = this.add.text(rCx, loadingY, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui', fontSize: '20px', color: '#64748b',
    }).setOrigin(0.5)

    const spinY = Math.round(H * 0.69)
    const spinner = this.add.graphics()
    const spinTween = this.tweens.add({
      targets: { a: 0 }, a: 360, duration: 900, repeat: -1,
      onUpdate: (tw) => {
        const a = (tw.targets[0] as { a: number }).a
        spinner.clear()
        spinner.lineStyle(3, 0x0ea5e9, 1)
        spinner.beginPath()
        spinner.arc(rCx, spinY, 13, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 260))
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
    spinTween.stop()
    spinner.destroy()
    loadingText.setText('✓  ¡Preguntas listas!')
    loadingText.setStyle({ color: '#10b981', fontSize: '22px' })

    // Play button — 72%–96% of height
    const btnTop = Math.round(H * 0.73)
    const btnAreaH = H - btnTop - 16
    const btnW = rW - 20
    const btnH = Math.max(72, Math.min(130, Math.round(btnAreaH * 0.72)))
    const btnY = btnTop + btnAreaH / 2
    const btnFontSize = Math.round(Math.min(36, btnH * 0.44))

    this.add.rectangle(rCx + 5, btnY + 5, btnW, btnH, 0x012a55, 0.7)
    this.add.rectangle(rCx, btnY, btnW + 8, btnH + 8, 0x0ea5e9, 0.2)
    const btnBg = this.add.rectangle(rCx, btnY, btnW, btnH, 0x0284c7).setInteractive({ useHandCursor: true })
    this.add.rectangle(rCx, btnY - btnH / 2 + 11, btnW - 14, 18, 0xffffff, 0.11)
    this.add.text(rCx, btnY, '▶  ¡Jugar!', {
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

  // ── MOBILE: single-column ─────────────────────────────────────────────────

  private async layoutMobile(W: number, H: number) {
    const theory = THEORY[this.topic] ?? DEFAULT_THEORY
    const pad = 14

    // Top strip — level identity
    const topH = Math.round(H * 0.24)
    this.add.rectangle(W / 2, topH / 2, W, topH, 0x0a1628).setStrokeStyle(1, 0x0ea5e9, 0.6)
    this.add.rectangle(W / 2, topH, W, 2, 0x0ea5e9, 0.4)

    const nameFontSize = Math.round(Math.min(34, H * 0.075))
    this.add.text(W / 2, topH * 0.35, this.levelName, {
      fontFamily: 'Exo 2, system-ui', fontSize: `${nameFontSize}px`,
      color: '#f1f9ff', fontStyle: 'bold',
      wordWrap: { width: W - 24 }, align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 8, fill: true },
    }).setOrigin(0.5, 0.5)

    const topicLabel = TOPIC_LABEL[this.topic] ?? this.topic
    this.add.text(W / 2, topH * 0.76, topicLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '17px', color: '#64748b', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5)

    // Formula card
    const midTop = topH + pad
    const midH = Math.round(H * 0.36)
    const midCy = midTop + midH / 2

    this.add.rectangle(W / 2, midCy, W - pad * 2, midH - 4, 0x0c2233).setStrokeStyle(2, 0x0ea5e9)

    this.add.text(W / 2, midCy - midH * 0.28, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '18px',
      color: '#7dd3fc', fontStyle: 'bold',
      wordWrap: { width: W - pad * 3 }, align: 'center',
    }).setOrigin(0.5, 0.5)

    this.add.text(W / 2, midCy, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui', fontSize: '14px', color: '#334155',
    }).setOrigin(0.5, 0.5)

    this.add.text(W / 2, midCy + midH * 0.28, `💡  ${theory.example}`, {
      fontFamily: 'JetBrains Mono, monospace', fontSize: '15px',
      color: '#fde68a', wordWrap: { width: W - pad * 3 }, align: 'center',
    }).setOrigin(0.5, 0.5)

    // Loading status
    const statusTop = midTop + midH + pad
    const statusH = Math.round(H * 0.12)
    const statusCy = statusTop + statusH / 2

    const loadingText = this.add.text(W / 2, statusCy, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui', fontSize: '17px', color: '#64748b',
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
    loadingText.setText('✓  ¡Preguntas listas!')
    loadingText.setStyle({ color: '#10b981', fontSize: '19px' })

    // Play button — full width, bottom
    const btnH = Math.max(56, Math.round(H * 0.14))
    const btnW = W - pad * 2
    const btnY = H - pad - btnH / 2
    const btnFontSize = Math.round(Math.min(30, btnH * 0.46))

    this.add.rectangle(W / 2 + 5, btnY + 5, btnW, btnH, 0x012a55, 0.6)
    this.add.rectangle(W / 2, btnY, btnW + 8, btnH + 8, 0x0ea5e9, 0.15)
    const btnBg = this.add.rectangle(W / 2, btnY, btnW, btnH, 0x0284c7).setInteractive({ useHandCursor: true })
    this.add.text(W / 2, btnY, '▶  ¡Jugar!', {
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

  private drawDivider(x: number, y: number, w: number) {
    const g = this.add.graphics()
    g.lineStyle(1, 0x1e3a5f, 1)
    g.lineBetween(x, y, x + w, y)
  }
}
