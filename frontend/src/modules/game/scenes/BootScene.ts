import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    this.genPlayer()
    this.genPlatform()
    this.genPortalClosed()
    this.genPortalOpen()
    this.genParticle()
    this.genCoin()
    this.genGoal()
    this.genBackground()

    // When launched from React (GamePage), level config is stored in the Phaser registry.
    // Skip MenuScene and go directly to GameScene (data loader → PlayScene).
    const levelConfig = this.game.registry.get('levelConfig')
    if (levelConfig) {
      this.scene.start('GameScene', levelConfig)
    } else {
      this.scene.start('MenuScene')
    }
  }

  // ── Atom: glowing nucleus with inner highlight ───────────────────────────
  private genPlayer() {
    const S = 48
    const C = S / 2
    const g = this.make.graphics()

    // outer glow
    g.fillStyle(0x0ea5e9, 0.18)
    g.fillCircle(C, C, C)
    // mid glow
    g.fillStyle(0x0284c7, 0.4)
    g.fillCircle(C, C, 20)
    // main body
    g.fillStyle(0x0369a1, 1)
    g.fillCircle(C, C, 15)
    // specular highlight
    g.fillStyle(0x7dd3fc, 0.9)
    g.fillCircle(C - 5, C - 5, 6)
    // nucleus
    g.fillStyle(0xf0f9ff, 1)
    g.fillCircle(C, C, 4)

    g.generateTexture('player', S, S)
    g.destroy()
  }

  // ── Platform tile ───────────────────────────────────────────────��────────
  private genPlatform() {
    const W = 128, H = 24
    const g = this.make.graphics()

    g.fillStyle(0x0c4a6e, 1)
    g.fillRect(0, 0, W, H)
    // top edge glow
    g.lineStyle(2, 0x0ea5e9, 0.9)
    g.lineBetween(0, 1, W, 1)
    // subtle grid
    g.lineStyle(1, 0x075985, 0.6)
    for (let x = 16; x < W; x += 16) g.lineBetween(x, 2, x, H)
    // outer border
    g.lineStyle(1, 0x0369a1, 0.5)
    g.strokeRect(0, 0, W, H)

    g.generateTexture('platform', W, H)
    g.destroy()
  }

  // ── Closed portal: purple energy gate ────────────────────────────────────
  private genPortalClosed() {
    const W = 52, H = 100
    const g = this.make.graphics()

    // inner fill
    g.fillStyle(0x4c1d95, 0.7)
    g.fillRect(4, 0, W - 8, H)
    // scan lines (energy effect)
    g.lineStyle(1, 0xa78bfa, 0.5)
    for (let y = 8; y < H; y += 8) g.lineBetween(6, y, W - 6, y)
    // frame
    g.lineStyle(3, 0x7c3aed, 1)
    g.strokeRect(4, 0, W - 8, H)
    // side pillars
    g.fillStyle(0x6d28d9, 1)
    g.fillRect(0, 0, 6, H)
    g.fillRect(W - 6, 0, 6, H)
    // top bar
    g.fillStyle(0x7c3aed, 1)
    g.fillRect(0, 0, W, 6)
    g.generateTexture('portal-closed', W, H)
    g.destroy()
  }

  // ── Open portal: green flash ─────────────────────────────────────────────
  private genPortalOpen() {
    const W = 52, H = 100
    const g = this.make.graphics()

    g.fillStyle(0x064e3b, 0.6)
    g.fillRect(4, 0, W - 8, H)
    g.lineStyle(1, 0x34d399, 0.5)
    for (let y = 8; y < H; y += 8) g.lineBetween(6, y, W - 6, y)
    g.lineStyle(3, 0x059669, 1)
    g.strokeRect(4, 0, W - 8, H)
    g.fillStyle(0x047857, 1)
    g.fillRect(0, 0, 6, H)
    g.fillRect(W - 6, 0, 6, H)
    g.fillStyle(0x059669, 1)
    g.fillRect(0, 0, W, 6)

    g.generateTexture('portal-open', W, H)
    g.destroy()
  }

  // ── Background molecule particle ─────────────────────────────────────────
  private genParticle() {
    const S = 10
    const g = this.make.graphics()
    g.fillStyle(0x38bdf8, 0.6)
    g.fillCircle(S / 2, S / 2, S / 2)
    g.generateTexture('particle', S, S)
    g.destroy()
  }

  // ── Collectible atom token ───────────────────────────────────────────────
  private genCoin() {
    const S = 22
    const C = S / 2
    const g = this.make.graphics()

    g.fillStyle(0xf59e0b, 0.3)
    g.fillCircle(C, C, C)
    g.fillStyle(0xfbbf24, 1)
    g.fillCircle(C, C, 8)
    g.fillStyle(0xfef3c7, 0.8)
    g.fillCircle(C - 2, C - 2, 3)

    g.generateTexture('coin', S, S)
    g.destroy()
  }

  // ── Goal marker ──────────────────────────────────────────────────────────
  private genGoal() {
    const W = 44, H = 80
    const g = this.make.graphics()

    // pole
    g.fillStyle(0x94a3b8, 1)
    g.fillRect(W / 2 - 2, 0, 4, H)
    // flag
    g.fillStyle(0x10b981, 1)
    g.fillTriangle(W / 2 + 2, 10, W - 4, 24, W / 2 + 2, 38)
    // base
    g.fillStyle(0x475569, 1)
    g.fillRect(W / 2 - 10, H - 10, 20, 10)
    // glow ring at base
    g.lineStyle(2, 0x10b981, 0.7)
    g.strokeEllipse(W / 2, H - 5, 24, 10)

    g.generateTexture('goal', W, H)
    g.destroy()
  }

  // ── Background star/fog tile ─────────────────────────────────────────────
  private genBackground() {
    const W = 80, H = 80
    const g = this.make.graphics()
    g.fillStyle(0x020617, 1)
    g.fillRect(0, 0, W, H)
    // random stars at fixed positions
    const stars = [[10,15],[40,8],[65,30],[20,55],[55,70],[72,18],[30,40]]
    stars.forEach(([x, y]) => {
      g.fillStyle(0xf1f5f9, 0.6)
      g.fillCircle(x, y, 1)
    })
    g.generateTexture('bg-tile', W, H)
    g.destroy()
  }
}
