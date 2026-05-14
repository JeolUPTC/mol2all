import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { gameEventBus } from '../bridge/gameEventBus'
import type { GameQuestion } from '../services/questions.service'

const WORLD_W = 2600
const DESIGN_H = 600   // reference height the layout was designed for
const GROUND_Y = 572   // design-space ground Y
const GOAL_X = 2200
const GOAL_Y = 520
const CHAPEL_LEFT  = 2148
const CHAPEL_RIGHT = 2278
const CHAPEL_TOP   = 434

const PORTAL_POSITIONS: { x: number; y: number }[] = [
  { x: 284, y: 394 },
  { x: 604, y: 354 },
  { x: 904, y: 394 },
  { x: 1224, y: 330 },
  { x: 1524, y: 370 },
]

// Safe respawn after wrong answer: portal 0 → game start; portal N → above previous platform.
// y is design-space (will be passed through sy()). Player drops from above onto the platform.
// Respawn AFTER the previous portal so the player doesn't have to re-pass it.
// x values are just to the right of each portal on its platform; y drops from above.
const PORTAL_RESPAWN: { x: number; y: number }[] = [
  { x: 80,   y: 500 },  // portal 0 → game start (no previous)
  { x: 350,  y: 380 },  // portal 1 → after portal 0 (x=284) on platform 0 right tile
  { x: 668,  y: 340 },  // portal 2 → after portal 1 (x=604) on platform 1 right tile
  { x: 968,  y: 380 },  // portal 3 → after portal 2 (x=904) on platform 2 right tile
  { x: 1288, y: 316 },  // portal 4 → after portal 3 (x=1224) on platform 3 right tile
]

const PLATFORMS: { x: number; y: number; tiles: number }[] = [
  { x: 220, y: 456, tiles: 2 },
  { x: 540, y: 416, tiles: 2 },
  { x: 840, y: 456, tiles: 2 },
  { x: 1160, y: 392, tiles: 2 },
  { x: 1460, y: 432, tiles: 2 },
  { x: 1880, y: 368, tiles: 3 },
  { x: 2040, y: 416, tiles: 2 },
]

const COINS: { x: number; y: number }[] = [
  { x: 220, y: 422 }, { x: 348, y: 422 },
  { x: 540, y: 382 }, { x: 668, y: 382 },
  { x: 840, y: 422 },
  { x: 1160, y: 358 }, { x: 1288, y: 358 },
  { x: 1880, y: 334 }, { x: 2008, y: 334 },
  { x: 2136, y: 334 },
]

interface LevelTheme {
  overlayColor: number; overlayAlpha: number
  gridColor: number;   gridAlpha: number
  particleColor: number
}

const TOPIC_THEMES: Record<string, LevelTheme> = {
  molar_mass:       { overlayColor: 0x0ea5e9, overlayAlpha: 0.03, gridColor: 0x0ea5e9, gridAlpha: 0.055, particleColor: 0x38bdf8 },
  balancing:        { overlayColor: 0x10b981, overlayAlpha: 0.04, gridColor: 0x10b981, gridAlpha: 0.060, particleColor: 0x34d399 },
  stoichiometry:    { overlayColor: 0x8b5cf6, overlayAlpha: 0.05, gridColor: 0x8b5cf6, gridAlpha: 0.060, particleColor: 0xc4b5fd },
  limiting_reagent: { overlayColor: 0xf59e0b, overlayAlpha: 0.04, gridColor: 0xf59e0b, gridAlpha: 0.055, particleColor: 0xfcd34d },
  yield:            { overlayColor: 0xef4444, overlayAlpha: 0.04, gridColor: 0xef4444, gridAlpha: 0.055, particleColor: 0xfca5a5 },
}
const DEFAULT_THEME: LevelTheme = TOPIC_THEMES.molar_mass

interface PlaySceneData {
  questions: GameQuestion[]
  levelName: string
  topic?: string
  difficulty?: number
  levelOrder?: number
}

interface ResultConfig {
  topic: string; difficulty: number; levelName: string; totalQuestions: number; levelOrder: number
}

export class PlayScene extends Phaser.Scene {
  private player!: Player

  private ground!: Phaser.Physics.Arcade.StaticGroup
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private portalGroup!: Phaser.Physics.Arcade.StaticGroup
  private coins!: Phaser.Physics.Arcade.StaticGroup
  private goal!: Phaser.Physics.Arcade.Image

  private questions: GameQuestion[] = []
  private levelName = 'Nivel 1'
  private topic = 'molar_mass'
  private difficulty = 1
  private theme: LevelTheme = DEFAULT_THEME

  private portalCleared: boolean[] = []
  private questionPool: number[] = []
  private portalQuestion: (number | null)[] = []

  private isQuizActive = false
  private goalReached = false
  private lives = 3
  private score = 0
  private energy = 100
  private answeredCount = 0

  private goalGateGfx: Phaser.GameObjects.Graphics | null = null
  private goalGateLockText: Phaser.GameObjects.Text | null = null
  private goalGateWall: Phaser.GameObjects.Zone | null = null
  private goalGateCollider: Phaser.Physics.Arcade.Collider | null = null
  private gateOpen = false
  private lastGoalMsgTime = 0
  private lastHazardTime = 0

  private levelOrder = 1

  private enemyGroup!: Phaser.Physics.Arcade.StaticGroup
  private lastEnemyHitTime = 0

  private rainDropGroup?: Phaser.Physics.Arcade.Group
  private lastAcidHitTime = 0

  private bouncers: Phaser.Physics.Arcade.Image[] = []
  private lastBouncerHitTime = 0

  private lastBombHitTime = 0

  /** Vertical scale factor: actual screen height / design height (600). */
  private sY = 1

  constructor() {
    super({ key: 'PlayScene' })
  }

  /** Maps a design-space Y coordinate to actual screen Y. */
  private sy(v: number): number {
    return Math.round(v * this.sY)
  }

  init(data: PlaySceneData) {
    const qs = [...(data.questions ?? [])]
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[qs[i], qs[j]] = [qs[j], qs[i]]
    }
    this.questions = qs
    this.levelName = data.levelName ?? 'Nivel 1'
    this.topic     = data.topic      ?? 'molar_mass'
    this.difficulty = data.difficulty ?? 1
    this.theme     = TOPIC_THEMES[this.topic] ?? DEFAULT_THEME

    this.portalCleared  = new Array(PORTAL_POSITIONS.length).fill(false)
    this.questionPool   = qs.map((_, i) => i)
    this.portalQuestion = new Array(PORTAL_POSITIONS.length).fill(null)

    this.isQuizActive = false
    this.goalReached = false
    this.goalGateGfx = null
    this.goalGateLockText = null
    this.goalGateWall = null
    this.goalGateCollider = null
    this.gateOpen = false
    this.lastGoalMsgTime = 0
    this.lastHazardTime = 0
    this.lives = 3; this.score = 0; this.energy = 100; this.answeredCount = 0
    this.levelOrder = data.levelOrder ?? 1
    this.lastEnemyHitTime = 0
    this.lastAcidHitTime = 0
    this.lastBouncerHitTime = 0
    this.lastBombHitTime = 0
    this.bouncers = []
  }

  create() {
    // Derive vertical scale from the actual viewport height vs the 600-unit design height.
    // Capped at 1.8 to avoid over-stretching on very tall screens.
    this.sY = Math.min(this.scale.height / DESIGN_H, 1.8)

    const WH = this.scale.height
    this.physics.world.setBounds(0, 0, WORLD_W, WH)
    this.cameras.main.setBounds(0, 0, WORLD_W, WH)

    this.buildBackground()
    this.buildGround()
    this.buildPlatforms()
    this.buildPortals()
    this.buildCoins()
    this.buildGoal()
    this.spawnParticles()

    this.player = new Player(this, 80, this.sy(500))
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.12, 0.12)

    // React HUD opens theory modal — just pause/resume Phaser, React handles the display
    const theoryHandler = () => { if (!this.isQuizActive) this.scene.pause('PlayScene') }
    const theoryCloseHandler = () => { try { this.scene.resume('PlayScene') } catch (_) {} }
    window.addEventListener('mol2all:theory:open', theoryHandler)
    window.addEventListener('mol2all:theory:close', theoryCloseHandler)
    this.events.once('shutdown', () => {
      window.removeEventListener('mol2all:theory:open', theoryHandler)
      window.removeEventListener('mol2all:theory:close', theoryCloseHandler)
    })

    // Emit initial question count so React HUD can show 0/N
    gameEventBus.emit('question:answered', { count: 0, total: this.questions.length })

    this.physics.add.collider(this.player.getSprite(), this.ground)
    this.physics.add.collider(this.player.getSprite(), this.platforms)

    this.physics.add.overlap(
      this.player.getSprite(), this.portalGroup,
      (_p, portalBody) => {
        this.triggerPortal((portalBody as Phaser.Physics.Arcade.Image).getData('index') as number)
      },
      (_p, portalBody) => {
        const idx = (portalBody as Phaser.Physics.Arcade.Image).getData('index') as number
        return !this.portalCleared[idx] && !this.isQuizActive
      },
      this,
    )

    this.physics.add.overlap(this.player.getSprite(), this.coins, (_p, coinObj) => {
      const coin = coinObj as Phaser.Physics.Arcade.Image
      coin.disableBody(true, false)
      this.tweens.add({ targets: coin, y: coin.y - 28, alpha: 0, duration: 260, onComplete: () => coin.destroy() })
      this.score += 15
      this.showFloatingText(coin.x, coin.y - 10, '+15', '#f59e0b')
    })

    this.physics.add.overlap(this.player.getSprite(), this.goal, () => this.handleGoalReach())
    this.buildChapel()
    this.buildHazardFloor()
    this.buildEnemies()
    if (this.levelOrder >= 3) this.buildAcidRain()
    if (this.levelOrder >= 4) this.buildBombs()
    if (this.levelOrder >= 5) {
      this.buildOneBouncer(360, this.sy(280), 215, -175)
      if (this.levelOrder >= 6) {
        this.buildOneBouncer(1100, this.sy(200), -255, 135)
        this.buildOneBouncer(800, this.sy(350), 190, -215)
      }
    }
  }

  update() {
    this.player.update()
    this.checkHazardFloor()
    this.updateBouncers()
  }

  // ── World ──────────────────────────────────────────────────────────────────

  private buildBackground() {
    const WH = this.scale.height
    this.add.tileSprite(WORLD_W / 2, WH / 2, WORLD_W, WH, 'bg-tile').setDepth(0)
    this.add.rectangle(WORLD_W / 2, WH / 2, WORLD_W, WH, this.theme.overlayColor, this.theme.overlayAlpha).setDepth(0.5)
    const g = this.add.graphics().setDepth(1)
    g.lineStyle(1, this.theme.gridColor, this.theme.gridAlpha)
    for (let x = 0; x < WORLD_W; x += 240) g.lineBetween(x, this.sy(100), x + 200, this.sy(380))
  }

  private buildGround() {
    this.ground = this.physics.add.staticGroup()
    for (let i = 0; i < Math.ceil(WORLD_W / 128) + 1; i++) {
      (this.ground.create(i * 128 + 64, this.sy(GROUND_Y), 'platform') as Phaser.Physics.Arcade.Image).setDepth(3).refreshBody()
    }
  }

  private buildPlatforms() {
    this.platforms = this.physics.add.staticGroup()
    for (const pd of PLATFORMS) {
      for (let t = 0; t < pd.tiles; t++) {
        (this.platforms.create(pd.x + t * 128, this.sy(pd.y), 'platform') as Phaser.Physics.Arcade.Image).setDepth(3).refreshBody()
      }
    }
  }

  private buildPortals() {
    this.portalGroup = this.physics.add.staticGroup()
    PORTAL_POSITIONS.forEach((pos, i) => {
      const portal = this.portalGroup.create(pos.x, this.sy(pos.y), 'portal-closed') as Phaser.Physics.Arcade.Image
      portal.setData('index', i).setDepth(4).setSize(44, 100).refreshBody()

      const qMark = this.add.text(pos.x, this.sy(pos.y) - this.sy(62), '?', {
        fontFamily: 'Exo 2, system-ui', fontSize: '48px', color: '#ef4444', fontStyle: 'bold',
        stroke: '#7f1d1d', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(5)
      this.tweens.add({ targets: qMark, scaleX: 1.18, scaleY: 1.18, duration: 550 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

      this.tweens.add({ targets: portal, scaleX: 1.04, scaleY: 1.02, duration: 1000 + i * 140, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    })
  }

  private buildCoins() {
    this.coins = this.physics.add.staticGroup()
    for (const cd of COINS) {
      const sy = this.sy(cd.y)
      const coin = this.coins.create(cd.x, sy, 'coin') as Phaser.Physics.Arcade.Image
      coin.setDepth(3).refreshBody()
      this.tweens.add({ targets: coin, y: sy - 7, duration: 820 + Math.random() * 360, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    }
  }

  private buildGoal() {
    this.goal = this.physics.add.staticImage(GOAL_X, this.sy(GOAL_Y), 'goal').setDepth(4)
    this.goal.setSize(24, 76).refreshBody()
    const g = this.add.graphics().setDepth(3)
    g.lineStyle(2, 0x10b981, 0.45)
    g.strokeEllipse(GOAL_X, this.sy(558), 60, 14)
  }

  private spawnParticles() {
    const color = this.theme.particleColor
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, WORLD_W)
      const y = Phaser.Math.Between(this.sy(40), this.sy(520))
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.16).setDepth(1)
      this.tweens.add({
        targets: dot, y: y - Phaser.Math.Between(this.sy(40), this.sy(90)), alpha: 0,
        duration: Phaser.Math.Between(3500, 7200), repeat: -1, delay: Phaser.Math.Between(0, 4500),
        onRepeat: () => { dot.setPosition(Phaser.Math.Between(0, WORLD_W), Phaser.Math.Between(this.sy(320), this.sy(540))); dot.setAlpha(0.16) },
      })
    }
  }

  // ── Portal / question logic ───────────────────────────────────────────────

  private triggerPortal(portalIndex: number) {
    if (this.isQuizActive || this.portalCleared[portalIndex]) return

    let questionIndex = this.portalQuestion[portalIndex]
    const isNewAssignment = questionIndex === null

    if (questionIndex === null) {
      if (this.questionPool.length === 0) {
        this.clearPortalVisual(portalIndex)
        this.portalCleared[portalIndex] = true
        return
      }
      const pickIdx = Phaser.Math.Between(0, this.questionPool.length - 1)
      questionIndex = this.questionPool[pickIdx]
      this.questionPool.splice(pickIdx, 1)
      this.portalQuestion[portalIndex] = questionIndex
    }

    this.isQuizActive = true
    this.player.isControlEnabled = false

    const portal = this.getPortalSprite(portalIndex)
    if (portal) this.tweens.add({ targets: portal, alpha: 0.4, duration: 90, yoyo: true, repeat: 3 })

    const qIdx = questionIndex
    this.time.delayedCall(350, () => {
      this.scene.pause('PlayScene')
      const question = this.questions[qIdx]
      const onAnswer = (isCorrect: boolean, timeSpent: number) => {
        this.handleAnswer(isCorrect, timeSpent, portalIndex, qIdx)
      }

      if (isNewAssignment) {
        this.scene.launch('RouletteScene', {
          totalQuestions: this.questions.length,
          selectedNumber: qIdx + 1,
          question,
          onAnswer,
        })
      } else {
        gameEventBus.emit('quiz:open', { question, onAnswer })
      }
    })
  }

  private handleAnswer(isCorrect: boolean, _timeSpent: number, portalIndex: number, questionIndex: number) {
    this.scene.resume('PlayScene')

    if (isCorrect) {
      this.portalCleared[portalIndex] = true
      this.portalQuestion[portalIndex] = null
      this.answeredCount++
      gameEventBus.emit('question:answered', { count: this.answeredCount, total: this.questions.length })
      const pts = 100 + (this.questions[questionIndex]?.difficulty ?? 1) * 25
      this.score += pts
      this.clearPortalVisual(portalIndex)
      this.player.flashCorrect()
      this.showBurst(PORTAL_POSITIONS[portalIndex].x, this.sy(PORTAL_POSITIONS[portalIndex].y), pts)
      gameEventBus.emit('score:updated', { score: this.score })
      if (this.answeredCount >= this.questions.length) {
        this.openChapelDoor()
      } else if (this.goalGateLockText && !this.gateOpen) {
        this.goalGateLockText.setText(`🔒\n${this.answeredCount}/${this.questions.length}`)
      }
    } else {
      this.questionPool.push(questionIndex)
      this.portalQuestion[portalIndex] = null

      this.lives--
      this.energy = Math.max(0, this.energy - 20)
      this.player.flashHit()
      gameEventBus.emit('life:lost', { livesRemaining: this.lives })
      gameEventBus.emit('energy:changed', { energy: this.energy })

      // Teleport player to the previous platform (or game start for portal 0).
      // Velocity knockback doesn't work: Player.update() zeroes vx every frame
      // while isControlEnabled is false.
      const resp = PORTAL_RESPAWN[portalIndex] ?? { x: 80, y: 500 }
      const sprite = this.player.getSprite()
      sprite.setPosition(resp.x, this.sy(resp.y))
      sprite.setVelocity(0, 0)

      if (this.lives <= 0) {
        this.time.delayedCall(900, () => {
          gameEventBus.emit('level:failed', { reason: 'Sin vidas' })
          gameEventBus.emit('level:result', { score: this.score, stars: 0, win: false, levelConfig: this.buildLevelConfig() })
          this.scene.pause('PlayScene')
        })
        return
      }
    }

    this.time.delayedCall(750, () => { this.isQuizActive = false; this.player.isControlEnabled = true })
  }

  private handleGoalReach() {
    if (this.isQuizActive || this.goalReached) return

    const total = this.questions.length
    if (this.answeredCount < total) {
      const now = this.time.now
      if (now - this.lastGoalMsgTime > 2000) {
        this.lastGoalMsgTime = now
        const remaining = total - this.answeredCount
        this.showFloatingText(
          this.goal.x, this.goal.y - 60,
          `🔒 ${remaining} pregunta${remaining > 1 ? 's' : ''} más`,
          '#f59e0b',
        )
      }
      return
    }

    this.goalReached = true

    this.player.isControlEnabled = false
    this.player.getSprite().setVelocity(0, 0)

    const stars = this.answeredCount >= total ? 3
      : this.answeredCount >= Math.ceil(total * 0.67) ? 2 : 1

    gameEventBus.emit('level:complete', { score: this.score, stars, timeSpent: 0 })

    this.cameras.main.shake(220, 0.007)
    this.time.delayedCall(420, () => this.cameras.main.fadeOut(650))
    this.cameras.main.once('camerafadeoutcomplete', () => {
      gameEventBus.emit('level:result', { score: this.score, stars, win: true, levelConfig: this.buildLevelConfig() })
      this.scene.pause('PlayScene')
    })
  }


  private buildLevelConfig(): ResultConfig {
    return { topic: this.topic, difficulty: this.difficulty, levelName: this.levelName, totalQuestions: this.questions.length, levelOrder: this.levelOrder }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private clearPortalVisual(index: number) {
    const portal = this.getPortalSprite(index)
    if (!portal) return
    portal.setTexture('portal-open')
    this.tweens.add({ targets: portal, alpha: 0, scaleY: 1.3, duration: 580, ease: 'Power2',
      onComplete: () => { portal.disableBody(true, false); portal.setVisible(false) } })
  }

  private getPortalSprite(index: number): Phaser.Physics.Arcade.Image | null {
    for (const child of this.portalGroup.getChildren()) {
      const img = child as Phaser.Physics.Arcade.Image
      if (img.getData('index') === index) return img
    }
    return null
  }

  private showBurst(x: number, y: number, pts: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const dot = this.add.circle(x, y, 5, 0x10b981, 1).setDepth(10)
      this.tweens.add({ targets: dot, x: x + Math.cos(angle) * 58, y: y + Math.sin(angle) * 38,
        alpha: 0, duration: 500, ease: 'Power2', onComplete: () => dot.destroy() })
    }
    this.showFloatingText(x, y - 28, `+${pts}`, '#10b981')
  }

  private showFloatingText(x: number, y: number, label: string, color: string) {
    const txt = this.add.text(x, y, label, {
      fontFamily: 'Exo 2, system-ui', fontSize: '22px', color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10)
    this.tweens.add({ targets: txt, y: y - 72, alpha: 0, duration: 900, ease: 'Power2', onComplete: () => txt.destroy() })
  }

  // ── Chapel ────────────────────────────────────────────────────────────────

  private buildChapel() {
    if (this.questions.length === 0) return

    const WH  = this.scale.height
    const ct  = this.sy(CHAPEL_TOP)
    const gy  = this.sy(GROUND_Y)

    const walls = this.add.graphics().setDepth(3)

    walls.fillStyle(0x0c1a2e, 0.75)
    walls.fillRect(CHAPEL_LEFT + 10, ct + this.sy(10), CHAPEL_RIGHT - CHAPEL_LEFT - 10, gy - ct - this.sy(10))

    walls.fillStyle(0x1e3a5f, 1)
    walls.fillRect(CHAPEL_LEFT + 10, ct, CHAPEL_RIGHT - CHAPEL_LEFT - 10, this.sy(10))
    walls.lineStyle(2, 0x38bdf8, 0.9)
    walls.lineBetween(CHAPEL_LEFT + 10, ct, CHAPEL_RIGHT, ct)

    walls.fillStyle(0x1e3a5f, 1)
    walls.fillRect(CHAPEL_RIGHT - 10, ct, 10, gy - ct)
    walls.lineStyle(2, 0x38bdf8, 0.9)
    walls.lineBetween(CHAPEL_RIGHT, ct, CHAPEL_RIGHT, gy + 2)

    walls.fillStyle(0x1e3a5f, 1)
    walls.fillRect(CHAPEL_LEFT + 2, ct, 8, this.sy(52))
    walls.lineStyle(2, 0x38bdf8, 0.9)
    walls.lineBetween(CHAPEL_LEFT + 8, ct, CHAPEL_LEFT + 8, ct + this.sy(52))

    walls.lineStyle(2, 0x7dd3fc, 0.6)
    walls.beginPath()
    walls.arc(CHAPEL_LEFT + 8, ct + this.sy(52), 24, Math.PI, 0, false)
    walls.strokePath()

    this.add
      .text((CHAPEL_LEFT + CHAPEL_RIGHT) / 2, ct - this.sy(16), '⚗  META', {
        fontFamily: 'Exo 2, system-ui', fontSize: '13px', color: '#7dd3fc', fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(4)

    const rightZone = this.add.zone(CHAPEL_RIGHT, WH / 2, 14, WH)
    this.physics.add.existing(rightZone, true)
    this.physics.add.collider(this.player.getSprite(), rightZone)

    this.goalGateGfx = this.add.graphics().setDepth(4)

    this.goalGateGfx.lineStyle(20, 0xf59e0b, 0.12)
    this.goalGateGfx.lineBetween(CHAPEL_LEFT + 6, ct, CHAPEL_LEFT + 6, gy)
    this.goalGateGfx.lineStyle(9, 0xf59e0b, 0.38)
    this.goalGateGfx.lineBetween(CHAPEL_LEFT + 6, ct, CHAPEL_LEFT + 6, gy)
    this.goalGateGfx.lineStyle(3, 0xfcd34d, 1)
    this.goalGateGfx.lineBetween(CHAPEL_LEFT + 6, ct, CHAPEL_LEFT + 6, gy)
    const stepY = this.sy(40)
    for (let y = ct + this.sy(18); y < gy; y += stepY) {
      this.goalGateGfx.lineStyle(2, 0xfcd34d, 0.75)
      this.goalGateGfx.lineBetween(CHAPEL_LEFT - 2, y, CHAPEL_LEFT + 14, y)
    }

    this.tweens.add({ targets: this.goalGateGfx, alpha: 0.55, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    this.goalGateLockText = this.add
      .text(CHAPEL_LEFT - 10, (ct + gy) / 2, `🔒\n0/${this.questions.length}`, {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '14px',
        color: '#fcd34d',
        align: 'center',
        lineSpacing: 3,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5)
      .setDepth(5)

    this.goalGateWall = this.add.zone(CHAPEL_LEFT, WH / 2, 16, WH)
    this.physics.add.existing(this.goalGateWall, true)

    this.goalGateCollider = this.physics.add.collider(
      this.player.getSprite(),
      this.goalGateWall,
      () => {
        if (this.gateOpen) return
        const now = this.time.now
        if (now - this.lastGoalMsgTime < 2500) return
        this.lastGoalMsgTime = now
        const rem = this.questions.length - this.answeredCount
        this.showFloatingText(
          CHAPEL_LEFT - 55, this.sy(465),
          `🔒 ${rem} pregunta${rem > 1 ? 's' : ''} pendiente${rem > 1 ? 's' : ''}`,
          '#f59e0b',
        )
      },
    )
  }

  private openChapelDoor() {
    if (this.gateOpen || !this.goalGateGfx) return
    this.gateOpen = true

    this.goalGateCollider?.destroy()
    if (this.goalGateWall?.body) {
      (this.goalGateWall.body as Phaser.Physics.Arcade.StaticBody).enable = false
    }

    this.tweens.add({
      targets: [this.goalGateGfx, this.goalGateLockText],
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => {
        this.goalGateGfx?.destroy()
        this.goalGateLockText?.destroy()
      },
    })

    this.showFloatingText(CHAPEL_LEFT + 64, this.sy(480), '¡Camino libre! ✓', '#10b981')
  }

  // ── Hazard floor ──────────────────────────────────────────────────────────

  private buildHazardFloor() {
    const gfx = this.add.graphics().setDepth(2)
    const START_X = 400, END_X = 2100
    const y558 = this.sy(558)
    const y572 = this.sy(572)
    const h = y572 - y558 || 14

    gfx.fillStyle(0xef4444, 0.13)
    gfx.fillRect(START_X, y558, END_X - START_X, h)

    for (let x = START_X; x < END_X; x += 30) {
      gfx.lineStyle(2, 0xef4444, 0.25)
      gfx.lineBetween(x, y558, x + 14, y572)
    }

    for (const lx of [420, 960, 1540]) {
      this.add.text(lx, y558 - 9, '⚠', {
        fontFamily: 'system-ui', fontSize: '11px', color: '#ef4444',
      }).setDepth(3)
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────────────

  private buildEnemies() {
    this.enemyGroup = this.physics.add.staticGroup()

    // All levels (2+) have enemies on every portal platform. Speed increases per level.
    // y ≈ platform.y − 30; range = patrol half-width in px.
    type EnemyDef = { x: number; y: number; range: number; speed: number }
    const ALL_PORTALS = (spd: number): EnemyDef[] => [
      { x: 284,  y: 426, range: 72, speed: spd      },
      { x: 604,  y: 386, range: 72, speed: spd + 5  },
      { x: 904,  y: 426, range: 72, speed: spd + 10 },
      { x: 1224, y: 362, range: 72, speed: spd + 15 },
      { x: 1524, y: 402, range: 72, speed: spd + 20 },
    ]
    const byLevel: Record<number, EnemyDef[]> = {
      1: [],
      2: ALL_PORTALS(70),
      3: ALL_PORTALS(90),
      4: ALL_PORTALS(108),
      5: ALL_PORTALS(124),
      6: ALL_PORTALS(140),
    }

    const defs = byLevel[this.levelOrder] ?? []
    if (defs.length === 0) return

    const texKey = 'mol-hazard'
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics()
      g.fillStyle(0xdc2626, 1)
      g.fillCircle(18, 18, 18)
      g.lineStyle(3, 0xfca5a5, 1)
      g.strokeCircle(18, 18, 18)
      g.lineStyle(2, 0xfca5a5, 0.7)
      g.lineBetween(8, 8, 28, 28)
      g.lineBetween(28, 8, 8, 28)
      g.generateTexture(texKey, 36, 36)
      g.destroy()
    }

    for (const def of defs) {
      const e = this.enemyGroup.create(def.x, this.sy(def.y), texKey) as Phaser.Physics.Arcade.Image
      e.setDepth(4).refreshBody()
      const duration = Math.round((def.range * 2 / def.speed) * 1000)
      this.tweens.add({
        targets: e,
        x: { from: def.x - def.range, to: def.x + def.range },
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => e.refreshBody(),
      })
    }

    this.physics.add.overlap(this.player.getSprite(), this.enemyGroup, () => this.handleEnemyHit())
  }

  private handleEnemyHit() {
    if (this.isQuizActive || this.goalReached) return
    const now = this.time.now
    if (now - this.lastEnemyHitTime < 1800) return
    this.lastEnemyHitTime = now

    this.lives = Math.max(0, this.lives - 1)
    this.energy = Math.max(0, this.energy - 20)
    this.player.flashHit()
    gameEventBus.emit('life:lost', { livesRemaining: this.lives })
    gameEventBus.emit('energy:changed', { energy: this.energy })

    const sprite = this.player.getSprite()
    const vx = (sprite.body as Phaser.Physics.Arcade.Body).velocity.x
    sprite.setVelocityX(vx > 0 ? -200 : 200)
    sprite.setVelocityY(-220)

    this.showFloatingText(sprite.x, sprite.y - 40, '⚗ ¡Molécula inestable! −1❤', '#ef4444')

    if (this.lives <= 0) {
      this.time.delayedCall(900, () => {
        gameEventBus.emit('level:failed', { reason: 'Sin vidas' })
        gameEventBus.emit('level:result', { score: this.score, stars: 0, win: false, levelConfig: this.buildLevelConfig() })
        this.scene.pause('PlayScene')
      })
    }
  }

  // ── Acid rain ─────────────────────────────────────────────────────────────

  private buildAcidRain() {
    const texKey = 'acid-drop'
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics()
      g.fillStyle(0x65a30d, 1)
      g.fillCircle(10, 12, 10)
      g.fillStyle(0xa3e635, 0.75)
      g.fillCircle(7, 8, 6)
      g.lineStyle(2, 0xbef264, 0.9)
      g.strokeCircle(10, 12, 10)
      g.generateTexture(texKey, 20, 22)
      g.destroy()
    }

    this.rainDropGroup = this.physics.add.group()

    const destroyDrop = (drop: Phaser.Physics.Arcade.Image) => {
      (drop.getData('shadow') as Phaser.GameObjects.Ellipse | undefined)?.destroy()
      drop.destroy()
    }

    this.physics.add.collider(this.rainDropGroup, this.ground, (drop) => {
      destroyDrop(drop as Phaser.Physics.Arcade.Image)
    })
    this.physics.add.collider(this.rainDropGroup, this.platforms, (drop) => {
      destroyDrop(drop as Phaser.Physics.Arcade.Image)
    })
    this.physics.add.overlap(this.player.getSprite(), this.rainDropGroup, (_p, drop) => {
      const d = drop as Phaser.Physics.Arcade.Image
      if (!d.active) return
      destroyDrop(d)
      this.handleAcidHit()
    })

    const interval = this.levelOrder >= 6 ? 3000 : 5000
    this.time.addEvent({ delay: interval, callback: () => this.spawnRainWave(), repeat: -1, startAt: 2200 })
  }

  private spawnRainWave() {
    if (this.isQuizActive || this.goalReached || !this.rainDropGroup) return
    const count = this.levelOrder >= 6 ? 5 : 3
    const groundY = this.sy(GROUND_Y)
    for (let i = 0; i < count; i++) {
      const spawnX = Phaser.Math.Between(350, 2050)
      const vx = Phaser.Math.Between(-110, 110)
      const vy = Phaser.Math.Between(240, 310)
      const tFall = (groundY + 20) / vy
      const landX = Phaser.Math.Clamp(spawnX + vx * tFall, 40, WORLD_W - 40)
      const shadow = this.add
        .ellipse(landX, groundY - 3, 22, 10, 0x84cc16, 0.35)
        .setDepth(2)
      const warn = this.add
        .text(spawnX, this.sy(32), '☣', { fontFamily: 'system-ui', fontSize: '15px', color: '#84cc16' })
        .setDepth(8).setOrigin(0.5)
      this.time.delayedCall(650, () => {
        warn.destroy()
        if (!this.rainDropGroup || this.goalReached) { shadow.destroy(); return }
        const drop = this.rainDropGroup.create(spawnX, -22, 'acid-drop') as Phaser.Physics.Arcade.Image
        drop.setDepth(7).setVelocity(vx, vy)
        drop.setData('shadow', shadow)
        this.time.delayedCall(4500, () => { if (drop.active) { shadow.destroy(); drop.destroy() } })
      })
    }
  }

  private handleAcidHit() {
    if (this.isQuizActive || this.goalReached) return
    const now = this.time.now
    if (now - this.lastAcidHitTime < 1800) return
    this.lastAcidHitTime = now

    this.lives = Math.max(0, this.lives - 1)
    this.energy = Math.max(0, this.energy - 15)
    this.player.flashHit()
    gameEventBus.emit('life:lost', { livesRemaining: this.lives })
    gameEventBus.emit('energy:changed', { energy: this.energy })
    this.showFloatingText(this.player.getSprite().x, this.player.getSprite().y - 40, '☣ ¡Lluvia ácida! −1❤', '#84cc16')

    if (this.lives <= 0) {
      this.time.delayedCall(900, () => {
        gameEventBus.emit('level:failed', { reason: 'Sin vidas' })
        gameEventBus.emit('level:result', { score: this.score, stars: 0, win: false, levelConfig: this.buildLevelConfig() })
        this.scene.pause('PlayScene')
      })
    }
  }

  // ── Timed bombs ───────────────────────────────────────────────────────────

  private buildBombs() {
    const texKey = 'bomb-hazard'
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics()
      g.fillStyle(0xff6600, 1)
      g.fillCircle(13, 15, 12)
      g.lineStyle(2, 0xff9900, 1)
      g.strokeCircle(13, 15, 12)
      g.lineStyle(3, 0xfcd34d, 1)
      g.lineBetween(13, 3, 18, 0)
      g.fillStyle(0xfef9c3, 1)
      g.fillCircle(19, 0, 3)
      g.generateTexture(texKey, 26, 28)
      g.destroy()
    }

    for (const pos of [{ x: 800, y: 456 }, { x: 1620, y: 432 }]) {
      this.time.delayedCall(Phaser.Math.Between(3000, 6500), () => this.triggerBomb(pos.x, this.sy(pos.y)))
    }
  }

  private triggerBomb(bx: number, by: number) {
    if (this.goalReached) return
    const bomb = this.add.image(bx, by - 26, 'bomb-hazard').setDepth(5)
    const warn = this.add.text(bx, by - 50, '⚠ ¡Inestable!', {
      fontFamily: 'Exo 2, system-ui', fontSize: '10px', color: '#ff9900',
    }).setOrigin(0.5).setDepth(5)

    this.tweens.add({
      targets: bomb,
      alpha: 0.25,
      duration: 220,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        bomb.destroy()
        warn.destroy()
        this.explodeBomb(bx, by)
      },
    })
  }

  private explodeBomb(bx: number, by: number) {
    if (this.goalReached) return

    const expl = this.add.circle(bx, by - 18, 8, 0xff4500, 0.9).setDepth(6)
    this.tweens.add({
      targets: expl, scaleX: 8, scaleY: 8, alpha: 0,
      duration: 480, ease: 'Power2', onComplete: () => expl.destroy(),
    })

    const boom = this.add.text(bx, by - 52, '💥', {
      fontFamily: 'system-ui', fontSize: '30px',
    }).setOrigin(0.5).setDepth(6)
    this.tweens.add({ targets: boom, y: boom.y - 28, alpha: 0, duration: 680, onComplete: () => boom.destroy() })

    const dist = Phaser.Math.Distance.Between(this.player.getSprite().x, this.player.getSprite().y, bx, by)
    if (dist < 68 && !this.isQuizActive) this.handleBombHit()

    this.time.delayedCall(Phaser.Math.Between(6500, 9000), () => this.triggerBomb(bx, by))
  }

  private handleBombHit() {
    const now = this.time.now
    if (now - this.lastBombHitTime < 1800) return
    this.lastBombHitTime = now

    this.lives = Math.max(0, this.lives - 1)
    this.energy = Math.max(0, this.energy - 20)
    this.player.flashHit()
    gameEventBus.emit('life:lost', { livesRemaining: this.lives })
    gameEventBus.emit('energy:changed', { energy: this.energy })

    const sprite = this.player.getSprite()
    sprite.setVelocityY(-260)
    this.showFloatingText(sprite.x, sprite.y - 40, '💥 ¡Explosión! −1❤', '#ff6600')

    if (this.lives <= 0) {
      this.time.delayedCall(900, () => {
        gameEventBus.emit('level:failed', { reason: 'Sin vidas' })
        gameEventBus.emit('level:result', { score: this.score, stars: 0, win: false, levelConfig: this.buildLevelConfig() })
        this.scene.pause('PlayScene')
      })
    }
  }

  // ── Bouncing molecules ────────────────────────────────────────────────────

  private buildOneBouncer(sx: number, sy: number, vx: number, vy: number) {
    const texKey = 'mol-bouncer'
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics()
      g.fillStyle(0xa855f7, 1)
      g.fillCircle(14, 14, 14)
      g.lineStyle(2, 0xe879f9, 1)
      g.strokeCircle(14, 14, 14)
      g.lineStyle(2, 0xfef9c3, 0.85)
      g.lineBetween(10, 6, 14, 16)
      g.lineBetween(14, 16, 18, 9)
      g.generateTexture(texKey, 28, 28)
      g.destroy()
    }

    const b = this.physics.add.image(sx, sy, texKey)
    b.setDepth(5)
    ;(b.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    b.setBounce(1, 1)
    b.setCollideWorldBounds(true)
    b.setVelocity(vx, vy)

    this.physics.add.collider(b, this.ground)
    this.physics.add.collider(b, this.platforms)
    this.physics.add.overlap(this.player.getSprite(), b, () => this.handleBouncerHit())
    this.bouncers.push(b)
  }

  private updateBouncers() {
    for (const b of this.bouncers) {
      if (!b.active || !b.body) continue
      const body = b.body as Phaser.Physics.Arcade.Body
      if (body.speed < 90) {
        const target = 210
        const s = body.speed || 1
        body.setVelocity(body.velocity.x * (target / s), body.velocity.y * (target / s))
      }
    }
  }

  private handleBouncerHit() {
    if (this.isQuizActive || this.goalReached) return
    const now = this.time.now
    if (now - this.lastBouncerHitTime < 1800) return
    this.lastBouncerHitTime = now

    this.lives = Math.max(0, this.lives - 1)
    this.energy = Math.max(0, this.energy - 20)
    this.player.flashHit()
    gameEventBus.emit('life:lost', { livesRemaining: this.lives })
    gameEventBus.emit('energy:changed', { energy: this.energy })

    const sprite = this.player.getSprite()
    const vx = (sprite.body as Phaser.Physics.Arcade.Body).velocity.x
    sprite.setVelocityX(vx > 0 ? -200 : 200)
    sprite.setVelocityY(-220)
    this.showFloatingText(sprite.x, sprite.y - 40, '⚡ ¡Molécula errante! −1❤', '#a855f7')

    if (this.lives <= 0) {
      this.time.delayedCall(900, () => {
        gameEventBus.emit('level:failed', { reason: 'Sin vidas' })
        gameEventBus.emit('level:result', { score: this.score, stars: 0, win: false, levelConfig: this.buildLevelConfig() })
        this.scene.pause('PlayScene')
      })
    }
  }

  private checkHazardFloor() {
    if (this.isQuizActive || this.goalReached) return
    const sprite = this.player.getSprite()
    if (sprite.y > this.sy(548) && sprite.x > 400 && sprite.x < 2100) {
      const now = this.time.now
      if (now - this.lastHazardTime > 2200) {
        this.lastHazardTime = now
        this.score = Math.max(0, this.score - 50)
        gameEventBus.emit('score:updated', { score: this.score })
        this.showFloatingText(sprite.x, sprite.y - 38, '¡Zona peligrosa! −50', '#ef4444')
      }
    }
  }
}
