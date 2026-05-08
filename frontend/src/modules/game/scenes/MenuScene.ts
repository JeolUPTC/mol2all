import Phaser from 'phaser'
import { gameEventBus } from '../bridge/gameEventBus'
import type { LevelTopic } from '../services/questions.service'

interface LevelOption {
  topic: LevelTopic
  name: string
  subtitle: string
  difficulty: 1 | 2 | 3
  color: number
  textColor: string
  totalQuestions?: number
}

const LEVELS: LevelOption[] = [
  { topic: 'molar_mass',      name: 'Masa Molar',          subtitle: 'Calcula masas molares',    difficulty: 1, color: 0x0369a1, textColor: '#7dd3fc' },
  { topic: 'balancing',       name: 'Balance Ecuaciones',  subtitle: 'Ecuaciones balanceadas',   difficulty: 1, color: 0x065f46, textColor: '#6ee7b7' },
  { topic: 'stoichiometry',   name: 'Estequiometría',      subtitle: 'Mol a mol, gramo a gramo', difficulty: 2, color: 0x6d28d9, textColor: '#c4b5fd' },
  { topic: 'limiting_reagent',name: 'Reactivo Limitante',  subtitle: 'Halla el reactivo límite', difficulty: 2, color: 0x92400e, textColor: '#fcd34d' },
  { topic: 'yield',           name: 'Rendimiento',         subtitle: 'Rendimiento porcentual',   difficulty: 3, color: 0x9f1239, textColor: '#fda4af' },
  { topic: 'mixed',           name: 'Maestro Químico',     subtitle: 'Todos los temas',          difficulty: 3, color: 0x4c1d95, textColor: '#e879f9' },
]

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a)

    // Floating background particles
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0x0ea5e9, 0.15)
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          dot.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(height / 2, height))
          dot.setAlpha(0.15)
        },
      })
    }

    // Logo
    const logo = this.add
      .text(width / 2, 60, 'MOL2ALL', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '52px',
        color: '#38bdf8',
        fontStyle: 'bold',
        stroke: '#0369a1',
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    this.tweens.add({
      targets: logo,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })

    this.add
      .text(width / 2, 108, 'Química · Gamificada · Divertida', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '13px',
        color: '#475569',
      })
      .setOrigin(0.5)

    // Level grid (2+3 layout)
    this.add
      .text(width / 2, 148, 'Elige un nivel', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '14px',
        color: '#64748b',
      })
      .setOrigin(0.5)

    const cardW = 148
    const cardH = 80
    const gapX = 16
    const rowStartX = width / 2 - cardW - gapX
    const row1Y = 210
    const row2Y = 322

    // Row 1: levels 1-3
    LEVELS.slice(0, 3).forEach((lvl, i) => {
      this.buildLevelCard(rowStartX + i * (cardW + gapX), row1Y, cardW, cardH, lvl, i)
    })

    // Row 2: levels 4-6
    LEVELS.slice(3).forEach((lvl, i) => {
      this.buildLevelCard(rowStartX + i * (cardW + gapX), row2Y, cardW, cardH, lvl, i + 3)
    })

    // Footer hint
    this.add
      .text(width / 2, height - 24, '← → Mover   ↑ / Espacio Saltar', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '11px',
        color: '#334155',
      })
      .setOrigin(0.5)
  }

  private buildLevelCard(
    cx: number,
    cy: number,
    w: number,
    h: number,
    lvl: LevelOption,
    index: number,
  ) {
    const bg = this.add
      .rectangle(cx, cy, w, h, lvl.color, 0.85)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x334155)

    this.add
      .text(cx, cy - 16, lvl.name, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '13px',
        color: lvl.textColor,
        fontStyle: 'bold',
        wordWrap: { width: w - 16 },
        align: 'center',
      })
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 6, lvl.subtitle, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '10px',
        color: '#94a3b8',
        wordWrap: { width: w - 16 },
        align: 'center',
      })
      .setOrigin(0.5)

    const diffLabel = '★'.repeat(lvl.difficulty) + '☆'.repeat(3 - lvl.difficulty)
    this.add
      .text(cx, cy + 24, diffLabel, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '12px',
        color: '#f59e0b',
      })
      .setOrigin(0.5)

    bg.on('pointerover', () => {
      bg.setStrokeStyle(2, 0x0ea5e9)
      this.tweens.add({ targets: bg, scaleX: 1.04, scaleY: 1.04, duration: 100 })
    })
    bg.on('pointerout', () => {
      bg.setStrokeStyle(1, 0x334155)
      this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 100 })
    })
    bg.on('pointerdown', () => {
      gameEventBus.emit('scene:ready', { sceneName: 'GameScene' })
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          topic: lvl.topic,
          difficulty: lvl.difficulty,
          totalQuestions: lvl.totalQuestions ?? 5,
          levelName: lvl.name,
          levelOrder: index + 1,
        })
      })
    })
  }
}
