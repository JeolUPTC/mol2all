import Phaser from 'phaser'

interface LevelConfig {
  topic: string
  difficulty: number
  levelName: string
  totalQuestions: number
}

interface ResultSceneData {
  score: number
  stars: number
  win: boolean
  levelConfig?: LevelConfig
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' })
  }

  create(data: ResultSceneData) {
    const { width, height } = this.cameras.main
    const win = data.win ?? false
    const stars = data.stars ?? 0
    const score = data.score ?? 0
    const levelConfig = data.levelConfig

    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a)

    if (win) this.spawnConfetti(width, height)

    // Title
    const titleY = height / 2 - 140
    const titleText = win ? '¡Nivel Completado!' : 'Fin del juego'
    const titleColor = win ? '#10b981' : '#ef4444'

    const title = this.add
      .text(width / 2, titleY - 30, titleText, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '44px',
        color: titleColor,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({ targets: title, alpha: 1, y: titleY, duration: 500, ease: 'Back.Out' })

    // Stars
    const starSpacing = 60
    const starsStartX = width / 2 - starSpacing
    const starsY = height / 2 - 60

    for (let i = 0; i < 3; i++) {
      const filled = i < stars
      const starTxt = this.add
        .text(starsStartX + i * starSpacing, starsY, filled ? '★' : '☆', {
          fontFamily: 'Exo 2, system-ui',
          fontSize: '52px',
          color: filled ? '#f59e0b' : '#334155',
          stroke: filled ? '#92400e' : 'transparent',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setScale(0)

      this.tweens.add({
        targets: starTxt,
        scaleX: 1, scaleY: 1,
        duration: 380,
        delay: 450 + i * 200,
        ease: 'Back.Out',
      })

      if (filled) {
        this.time.delayedCall(450 + i * 200 + 380, () => {
          this.tweens.add({ targets: starTxt, scaleX: 1.15, scaleY: 1.15, duration: 150, yoyo: true })
        })
      }
    }

    // Score counter
    const scoreLabel = this.add
      .text(width / 2, height / 2 + 20, '0 pts', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '34px',
        color: '#94a3b8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: scoreLabel, alpha: 1, duration: 300 })
      const counter = { value: 0 }
      this.tweens.add({
        targets: counter,
        value: score,
        duration: 800,
        ease: 'Power2',
        onUpdate: () => scoreLabel.setText(`${Math.floor(counter.value)} pts`),
        onComplete: () => scoreLabel.setStyle({ color: '#10b981' }),
      })
    })

    // Message
    const msg = stars === 3 ? '¡Perfecto! Respondiste todo correctamente.'
      : stars === 2 ? '¡Muy bien! Puedes mejorar aún más.'
      : win ? 'Sigue practicando para mejorar tu puntaje.'
      : '¡No te rindas! Intenta de nuevo.'

    this.add
      .text(width / 2, height / 2 + 74, msg, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '22px',
        color: '#94a3b8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    // Buttons
    const btnY = height / 2 + 130

    // Reintentar — restarts the same level (regenerates questions)
    const retryBtn = this.add
      .text(width / 2 - 110, btnY, '↺  Reintentar', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#1e293b',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    // Niveles — exit to dashboard (shows unlocked levels)
    const menuBtn = this.add
      .text(width / 2 + 110, btnY, '⌂  Niveles', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#0284c7',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#334155' }))
    retryBtn.on('pointerout', () => retryBtn.setStyle({ backgroundColor: '#1e293b' }))
    retryBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(250)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Restart same level through GameScene (regenerates fresh questions)
        if (levelConfig) {
          this.scene.start('GameScene', levelConfig)
        } else {
          this.scene.start('MenuScene')
        }
      })
    })

    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#0ea5e9' }))
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#0284c7' }))
    menuBtn.on('pointerdown', () => {
      // Go to React dashboard — shows unlocked levels with real progress data
      window.dispatchEvent(new CustomEvent('mol2all:game:exit'))
    })
  }

  private spawnConfetti(width: number, height: number) {
    const colors = [0x38bdf8, 0x10b981, 0xf59e0b, 0xf472b6, 0xa78bfa]
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, width)
      const color = colors[i % colors.length]
      const piece = this.add
        .rectangle(x, -10, Phaser.Math.Between(4, 8), Phaser.Math.Between(6, 12), color)
        .setDepth(0)

      this.tweens.add({
        targets: piece,
        y: height + 20,
        x: x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(1800, 3200),
        delay: Phaser.Math.Between(0, 1200),
        ease: 'Linear',
        onComplete: () => piece.destroy(),
      })
    }
  }
}
