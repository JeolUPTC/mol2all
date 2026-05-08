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
    const cx = width / 2

    this.add.rectangle(cx, height / 2, width, height, 0x0f172a)

    // Use mobile (single-column) layout for narrow or short screens
    const isMobile = width < 720 || height < 420
    if (isMobile) {
      await this.createMobileLayout(width, height, cx)
    } else {
      await this.createDesktopLayout(width, height)
    }
  }

  // ── Mobile: single-column ─────────────────────────────────────────────────

  private async createMobileLayout(width: number, height: number, cx: number) {
    const th = THEORY[this.topic] ?? DEFAULT_THEORY
    const pad = 16

    // Level name strip — top 22% of height
    const titleH = Math.max(72, Math.round(height * 0.22))
    const titleY = titleH / 2
    this.add.rectangle(cx, titleY, width, titleH, 0x0a1628).setStrokeStyle(1, 0x0ea5e9, 0.7)

    const nameFontSize = Math.round(Math.min(36, Math.max(24, height * 0.07)))
    this.add.text(cx, titleY - 10, this.levelName, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${nameFontSize}px`,
      color: '#f0f9ff',
      fontStyle: 'bold',
      wordWrap: { width: width - 32 },
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 8, fill: true },
    }).setOrigin(0.5)
    this.add.text(cx, titleY + nameFontSize / 2 + 2, th.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '15px',
      color: '#64748b',
      wordWrap: { width: width - 32 },
      align: 'center',
    }).setOrigin(0.5)

    // Formula card — occupies next 28% of height
    const fCardTop = titleH + pad
    const fCardH = Math.max(70, Math.round(height * 0.28))
    const fCardY = fCardTop + fCardH / 2
    this.add.rectangle(cx, fCardY, width - pad * 2, fCardH, 0x0c2233).setStrokeStyle(2, 0x0ea5e9)
    this.add.text(cx, fCardY - fCardH * 0.18, th.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '18px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      wordWrap: { width: width - pad * 2 - 20 },
      align: 'center',
    }).setOrigin(0.5)
    this.add.text(cx, fCardY + fCardH * 0.22, th.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#475569',
    }).setOrigin(0.5)

    // Status / loading — middle band
    const statusY = fCardTop + fCardH + pad * 2
    const loadingText = this.add.text(cx, statusY, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '17px',
      color: '#94a3b8',
    }).setOrigin(0.5)

    const spinnerY = statusY + 36
    const spinner = this.add.graphics()
    this.tweens.add({
      targets: { angle: 0 },
      angle: 360,
      duration: 900,
      repeat: -1,
      onUpdate: (tween) => {
        const a = (tween.targets[0] as { angle: number }).angle
        spinner.clear()
        spinner.lineStyle(3, 0x0ea5e9, 1)
        spinner.beginPath()
        spinner.arc(cx, spinnerY, 14, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 260))
        spinner.strokePath()
      },
    })

    let questions: GameQuestion[] = []
    let dots = ''
    const dotTimer = this.time.addEvent({
      delay: 380,
      callback: () => {
        dots = dots.length < 3 ? dots + '.' : ''
        loadingText.setText(`Generando preguntas${dots}`)
      },
      repeat: -1,
    })

    try {
      if (this.topic === 'mixed') {
        questions = await questionsService.generateMixed(this.totalQuestions)
      } else {
        questions = await questionsService.generateBatch(this.topic, this.difficulty, this.totalQuestions)
      }
    } catch { /* PlayScene handles empty array */ }

    dotTimer.destroy()
    spinner.clear()
    loadingText.setText('¡Preguntas listas!')
    loadingText.setStyle({ color: '#10b981' })

    // Play button — anchored to bottom
    const btnH = Math.max(52, Math.round(height * 0.13))
    const btnW = width - pad * 2
    const btnY = height - pad - btnH / 2
    const btnBtnFontSize = Math.round(Math.min(32, btnH * 0.48))
    const btnBg = this.add.rectangle(cx, btnY, btnW, btnH, 0x0284c7).setInteractive({ useHandCursor: true })
    this.add.text(cx, btnY, '▶  ¡Jugar!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${btnBtnFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
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

  // ── Desktop: two-column layout ────────────────────────────────────────────

  private async createDesktopLayout(width: number, height: number) {
    const theory = THEORY[this.topic] ?? DEFAULT_THEORY

    // Left: theory card — 48% of width, full height minus margins, starts below Salir button
    const cardW = Math.min(520, Math.round(width * 0.48))
    const cardX = cardW / 2 + 16
    const cardH = height - 32
    const cardY = height / 2

    this.add.rectangle(cardX, cardY, cardW, cardH, 0x0a1628).setStrokeStyle(2, 0x0ea5e9)

    // Content starts at y = 60 to clear the ← Salir React button overlay
    let ty = cardY - cardH / 2 + 60
    const tLeft = cardX - cardW / 2 + 24
    const textW = cardW - 48

    this.add.text(tLeft, ty, `📖  ${theory.title}`, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '26px',
      color: '#38bdf8',
      fontStyle: 'bold',
      wordWrap: { width: textW },
    })
    ty += 38

    this.add.text(tLeft, ty, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '17px',
      color: '#94a3b8',
      wordWrap: { width: textW },
    })
    ty += 30

    const sg = this.add.graphics()
    sg.lineStyle(1, 0x1e3a5f, 1)
    sg.lineBetween(tLeft, ty, tLeft + textW, ty)
    ty += 18

    this.add.text(tLeft, ty, theory.concept, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '18px',
      color: '#cbd5e1',
      wordWrap: { width: textW },
      lineSpacing: 8,
    })
    ty += 100

    // Formula box — proportional height
    const fboxH = 84
    this.add.rectangle(cardX, ty + fboxH / 2, cardW - 40, fboxH, 0x0c2233).setStrokeStyle(2, 0x0ea5e9)
    this.add.text(cardX, ty + 14, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '20px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      wordWrap: { width: cardW - 64 },
      align: 'center',
    }).setOrigin(0.5, 0)
    this.add.text(cardX, ty + fboxH - 20, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '15px',
      color: '#7dd3fc',
    }).setOrigin(0.5, 0)
    ty += fboxH + 18

    this.add.text(tLeft, ty, '💡 ' + theory.example, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '16px',
      color: '#fde68a',
      wordWrap: { width: textW },
    })
    ty += 52

    sg.lineStyle(1, 0x1e3a5f, 1)
    sg.lineBetween(tLeft, ty, tLeft + textW, ty)
    ty += 16

    this.add.text(tLeft, ty, '✦ Pasos clave', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '17px',
      color: '#10b981',
      fontStyle: 'bold',
    })
    ty += 26

    theory.tips.forEach((tip, i) => {
      this.add.text(tLeft, ty, `${i + 1}.  ${tip}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '17px',
        color: '#94a3b8',
        wordWrap: { width: textW },
      })
      ty += 30
    })

    // ── Right panel — distributed proportionally ───────────────────────────
    const rightStart = cardX + cardW / 2 + 8
    const rightW = width - rightStart - 8
    const rightCx = rightStart + rightW / 2

    // Title block — top 25% of height
    const titleY = Math.round(height * 0.22)
    const titleBoxH = 58
    this.add.rectangle(rightCx, titleY, rightW - 16, titleBoxH + 12, 0x0c2233, 0.9).setStrokeStyle(1, 0x0ea5e9, 0.6)
    this.add.text(rightCx, titleY, this.levelName, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${Math.min(42, Math.round(rightW * 0.12))}px`,
      color: '#f0f9ff',
      fontStyle: 'bold',
      wordWrap: { width: rightW - 32 },
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 12, fill: true },
    }).setOrigin(0.5)

    // Status row — 47% of height
    const statusY = Math.round(height * 0.47)
    const loadingText = this.add.text(rightCx, statusY, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '18px',
      color: '#94a3b8',
    }).setOrigin(0.5)

    const spinnerY = statusY + 42
    const spinner = this.add.graphics()
    this.tweens.add({
      targets: { angle: 0 },
      angle: 360,
      duration: 900,
      repeat: -1,
      onUpdate: (tween) => {
        const a = (tween.targets[0] as { angle: number }).angle
        spinner.clear()
        spinner.lineStyle(3, 0x0ea5e9, 1)
        spinner.beginPath()
        spinner.arc(rightCx, spinnerY, 16, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 260))
        spinner.strokePath()
      },
    })

    this.add.text(rightCx, statusY + 86, '↑ Lee la teoría mientras esperas', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '16px',
      color: '#475569',
    }).setOrigin(0.5)

    let questions: GameQuestion[] = []
    let dots = ''
    const dotTimer = this.time.addEvent({
      delay: 380,
      callback: () => {
        dots = dots.length < 3 ? dots + '.' : ''
        loadingText.setText(`Generando preguntas${dots}`)
      },
      repeat: -1,
    })

    try {
      if (this.topic === 'mixed') {
        questions = await questionsService.generateMixed(this.totalQuestions)
      } else {
        questions = await questionsService.generateBatch(this.topic, this.difficulty, this.totalQuestions)
      }
    } catch { /* PlayScene handles empty array */ }

    dotTimer.destroy()
    spinner.clear()
    loadingText.setText('¡Preguntas listas!')
    loadingText.setStyle({ color: '#10b981', fontSize: '20px' })

    // Play button — 65% of height, fills most of right panel width
    const btnW = Math.min(rightW - 16, 380)
    const btnH = Math.max(56, Math.round(height * 0.12))
    const btnY = Math.round(height * 0.66)
    const btnFontSize = Math.round(Math.min(32, btnH * 0.48))

    const btnShadow = this.add.rectangle(rightCx + 5, btnY + 5, btnW, btnH, 0x012a55).setAlpha(0)
    const btnGlow   = this.add.rectangle(rightCx, btnY, btnW + 8, btnH + 8, 0x0ea5e9, 0.22).setAlpha(0)
    const btnBg     = this.add.rectangle(rightCx, btnY, btnW, btnH, 0x0284c7)
      .setInteractive({ useHandCursor: true }).setAlpha(0)
    const btnShine  = this.add.rectangle(rightCx, btnY - btnH / 2 + 10, btnW - 8, 18, 0xffffff, 0.14).setAlpha(0)
    const btnLabel  = this.add.text(rightCx, btnY, '▶  ¡Jugar!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: `${btnFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: [btnShadow, btnGlow, btnBg, btnShine, btnLabel], alpha: 1, duration: 320, ease: 'Back.Out' })

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
}
