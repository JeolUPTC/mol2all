import Phaser from 'phaser'

export class HUDSystem {
  private livesText: Phaser.GameObjects.Text
  private scoreText: Phaser.GameObjects.Text
  private questionText: Phaser.GameObjects.Text
  private energyBarFill: Phaser.GameObjects.Rectangle
  private progressBarFill: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, levelName: string, totalQuestions: number, onTheory?: () => void) {
    const W = scene.cameras.main.width
    const H = 72          // strip height
    const MID = H / 2     // = 36

    // ── Background strip ──────────────────────────────────────────────────
    scene.add
      .rectangle(W / 2, MID, W, H, 0x020617, 0.96)
      .setScrollFactor(0)
      .setDepth(20)

    scene.add
      .rectangle(W / 2, H - 1, W, 2, 0x0ea5e9, 0.5)
      .setScrollFactor(0)
      .setDepth(20)

    // ── LEFT: Level name ──────────────────────────────────────────────────
    scene.add
      .text(14, 8, levelName, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '15px',
        color: '#94a3b8',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(21)

    // ── LEFT: Lives ───────────────────────────────────────────────────────
    this.livesText = scene.add
      .text(14, 34, '❤ × 3', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '22px',
        color: '#f87171',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(21)

    // ── RIGHT: Score ──────────────────────────────────────────────────────
    this.scoreText = scene.add
      .text(W - 14, 6, '0 pts', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '26px',
        color: '#34d399',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(21)

    // ── RIGHT: Question counter ───────────────────────────────────────────
    this.questionText = scene.add
      .text(W - 14, 40, `0/${totalQuestions}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '18px',
        color: '#cbd5e1',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(21)

    // ── Theory button ─────────────────────────────────────────────────────
    if (onTheory) {
      const theoryBtn = scene.add
        .text(W / 2 - 140, MID, '📖 Teoría', {
          fontFamily: 'Exo 2, system-ui',
          fontSize: '14px',
          color: '#38bdf8',
          backgroundColor: '#0c2233',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(21)
        .setInteractive({ useHandCursor: true })

      theoryBtn.on('pointerover', () => theoryBtn.setStyle({ backgroundColor: '#0e3a5f' }))
      theoryBtn.on('pointerout',  () => theoryBtn.setStyle({ backgroundColor: '#0c2233' }))
      theoryBtn.on('pointerdown', onTheory)
    }

    // ── CENTER: bars ──────────────────────────────────────────────────────
    const cx = W / 2
    const barW = 230
    const barH = 13

    // Progress row
    scene.add
      .text(cx - barW / 2 - 26, 12, '▶', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '14px',
        color: '#38bdf8',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(21)

    scene.add
      .rectangle(cx, 22, barW, barH, 0x1e3a5f)
      .setScrollFactor(0)
      .setDepth(21)

    this.progressBarFill = scene.add
      .rectangle(cx - barW / 2, 22, 0, barH, 0x38bdf8)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(22)

    // Energy row
    scene.add
      .text(cx - barW / 2 - 26, 42, '⚡', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '14px',
        color: '#fbbf24',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(21)

    scene.add
      .rectangle(cx, 52, barW, barH, 0x1e3a5f)
      .setScrollFactor(0)
      .setDepth(21)

    this.energyBarFill = scene.add
      .rectangle(cx - barW / 2, 52, barW, barH, 0xf59e0b)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(22)
  }

  update(lives: number, score: number, energy: number, answered: number, total: number) {
    this.livesText.setText(`❤ × ${lives}`)
    this.scoreText.setText(`${score} pts`)
    this.questionText.setText(`${answered}/${total}`)

    const progressPct = total > 0 ? answered / total : 0
    this.progressBarFill.width = Math.max(0, 230 * progressPct)

    const energyPct = Math.max(0, Math.min(1, energy / 100))
    this.energyBarFill.width = Math.max(0, 230 * energyPct)

    const energyColor = energyPct > 0.6 ? 0xf59e0b : energyPct > 0.3 ? 0xf97316 : 0xef4444
    this.energyBarFill.setFillStyle(energyColor)
  }

  punchScore() {
    this.scoreText.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
    })
  }
}
