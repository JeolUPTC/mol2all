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

    const isMobile = width < 600

    if (isMobile) {
      await this.createMobileLayout(width, height, cx)
    } else {
      await this.createDesktopLayout(width, height)
    }
  }

  // ── Mobile: single-column, compact ───────────────────────────────────────

  private async createMobileLayout(width: number, height: number, cx: number) {
    const th = THEORY[this.topic] ?? DEFAULT_THEORY
    const pad = 14

    // Level title strip
    const titleH = Math.round(height * 0.18)
    const titleY = titleH / 2
    this.add.rectangle(cx, titleY, width, titleH, 0x0a1628).setStrokeStyle(1, 0x0ea5e9, 0.6)
    this.add.text(cx, titleY - 6, this.levelName, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '26px',
      color: '#f0f9ff',
      fontStyle: 'bold',
      wordWrap: { width: width - 28 },
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 8, fill: true },
    }).setOrigin(0.5)
    this.add.text(cx, titleY + 18, th.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '12px',
      color: '#64748b',
      wordWrap: { width: width - 28 },
      align: 'center',
    }).setOrigin(0.5)

    // Compact formula card
    const fCardY = titleH + pad + Math.round((height - titleH - pad * 3) * 0.3)
    const fCardH = 80
    this.add.rectangle(cx, fCardY, width - pad * 2, fCardH, 0x0c2233).setStrokeStyle(1, 0x0ea5e9)
    this.add.text(cx, fCardY - 14, th.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '15px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      wordWrap: { width: width - pad * 2 - 20 },
      align: 'center',
    }).setOrigin(0.5)
    this.add.text(cx, fCardY + 18, th.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '12px',
      color: '#475569',
    }).setOrigin(0.5)

    // Loading area
    const loadAreaY = fCardY + fCardH / 2 + pad * 3
    const loadingText = this.add.text(cx, loadAreaY, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5)

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
        spinner.arc(cx, loadAreaY + 30, 14, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 260))
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
    } catch {
      // PlayScene handles empty array gracefully
    }

    dotTimer.destroy()
    spinner.clear()
    loadingText.setText('¡Preguntas listas!')
    loadingText.setStyle({ color: '#10b981' })

    // Play button
    const btnW = Math.min(260, width - pad * 2)
    const btnH = 54
    const btnY = height - pad * 2 - btnH / 2
    const btnBg = this.add.rectangle(cx, btnY, btnW, btnH, 0x0284c7).setInteractive({ useHandCursor: true })
    this.add.text(cx, btnY, '▶  ¡Jugar!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x0ea5e9))
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x0284c7))
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayScene', {
          questions,
          levelName: this.levelName,
          topic: this.topic,
          difficulty: this.difficulty,
          levelOrder: this.levelOrder,
        })
      })
    })
  }

  // ── Desktop: two-column layout ────────────────────────────────────────────

  private async createDesktopLayout(width: number, height: number) {
    const theory = THEORY[this.topic] ?? DEFAULT_THEORY

    const cardW = Math.min(420, width * 0.52)
    const cardX = cardW / 2 + 16
    const cardH = height - 40
    const cardY = height / 2

    this.add.rectangle(cardX, cardY, cardW, cardH, 0x0a1628).setStrokeStyle(2, 0x0ea5e9)

    let ty = cardY - cardH / 2 + 20
    const tLeft = cardX - cardW / 2 + 20

    this.add.text(tLeft, ty, `📖  ${theory.title}`, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '22px',
      color: '#38bdf8',
      fontStyle: 'bold',
    })
    ty += 32
    this.add.text(tLeft, ty, theory.subtitle, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#94a3b8',
    })
    ty += 26

    const sg = this.add.graphics()
    sg.lineStyle(1, 0x1e3a5f, 1)
    sg.lineBetween(tLeft, ty, tLeft + cardW - 40, ty)
    ty += 14

    this.add.text(tLeft, ty, theory.concept, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '15px',
      color: '#cbd5e1',
      wordWrap: { width: cardW - 40 },
      lineSpacing: 6,
    })
    ty += 84

    const fboxH = 68
    this.add.rectangle(cardX, ty + fboxH / 2, cardW - 40, fboxH, 0x0c2233).setStrokeStyle(1, 0x0ea5e9)
    this.add.text(cardX, ty + 10, theory.formula, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '16px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      wordWrap: { width: cardW - 60 },
    }).setOrigin(0.5, 0)
    this.add.text(cardX, ty + 44, theory.formulaLabel, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '13px',
      color: '#7dd3fc',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    ty += fboxH + 14

    this.add.text(tLeft, ty, '💡 ' + theory.example, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      color: '#fde68a',
      wordWrap: { width: cardW - 40 },
    })
    ty += 44

    sg.lineStyle(1, 0x1e3a5f, 1)
    sg.lineBetween(tLeft, ty, tLeft + cardW - 40, ty)
    ty += 14

    this.add.text(tLeft, ty, '✦ Pasos clave', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#10b981',
      fontStyle: 'bold',
    })
    ty += 22
    theory.tips.forEach((tip, i) => {
      this.add.text(tLeft, ty, `${i + 1}.  ${tip}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '14px',
        color: '#94a3b8',
        wordWrap: { width: cardW - 40 },
      })
      ty += 26
    })

    // ── RIGHT panel ───────────────────────────────────────────────────────
    const rightX = cardX + cardW / 2 + (width - cardX - cardW / 2) / 2

    const titleW = width - cardX - cardW / 2 - 24
    const titleY = Math.round(height / 2 - 90)
    this.add.rectangle(Math.round(rightX), titleY, titleW, 62, 0x0ea5e9, 0.06)
    this.add.rectangle(Math.round(rightX), titleY, titleW - 20, 50, 0x0c2233, 0.85)
      .setStrokeStyle(1, 0x0ea5e9, 0.5)
    this.add.text(Math.round(rightX), titleY, this.levelName, {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '38px',
      color: '#f0f9ff',
      fontStyle: 'bold',
      wordWrap: { width: titleW - 32 },
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#38bdf8', blur: 10, fill: true },
    }).setOrigin(0.5)

    const loadingText = this.add.text(rightX, height / 2 - 20, 'Generando preguntas...', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5)

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
        spinner.arc(rightX, height / 2 + 28, 14, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 260))
        spinner.strokePath()
      },
    })

    this.add.text(rightX, height / 2 + 76, '↑ Lee la teoría mientras esperas', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#94a3b8',
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
    } catch {
      // PlayScene handles empty array gracefully
    }

    dotTimer.destroy()
    spinner.clear()
    loadingText.setText('¡Preguntas listas!')
    loadingText.setStyle({ color: '#10b981' })

    const btnW = Math.min(220, titleW - 20)
    const btnH = 54
    const btnX = rightX
    const btnY = height / 2 + 30

    const btnShadow = this.add.rectangle(btnX + 5, btnY + 5, btnW, btnH, 0x012a55).setAlpha(0)
    const btnGlow = this.add.rectangle(btnX, btnY, btnW + 8, btnH + 8, 0x0ea5e9, 0.22).setAlpha(0)
    const btnBg = this.add.rectangle(btnX, btnY, btnW, btnH, 0x0284c7)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0)
    const btnShine = this.add.rectangle(btnX, btnY - btnH / 2 + 9, btnW - 6, 16, 0xffffff, 0.14).setAlpha(0)
    const btnLabel = this.add.text(btnX, btnY, '▶  ¡Jugar!', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    const btnParts = [btnShadow, btnGlow, btnBg, btnShine, btnLabel]
    this.tweens.add({ targets: btnParts, alpha: 1, duration: 320, ease: 'Back.Out' })

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x0ea5e9) })
    btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x0284c7) })
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayScene', {
          questions,
          levelName: this.levelName,
          topic: this.topic,
          difficulty: this.difficulty,
          levelOrder: this.levelOrder,
        })
      })
    })
  }
}
