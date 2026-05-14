import Phaser from 'phaser'

const SPEED = 220
const JUMP_VY = -540

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite
  /** Orbiting electron dot */
  private electron: Phaser.GameObjects.Arc
  private orbitAngle = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
  }

  private touchLeft = false
  private touchRight = false
  private touchJump = false
  private touchObjs: Phaser.GameObjects.GameObject[] = []
  private hasTouch = false

  isControlEnabled = true

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player')
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDepth(5)
    ;(this.sprite.body as Phaser.Physics.Arcade.Body).setSize(32, 36)

    this.electron = scene.add.circle(x, y, 4, 0x60a5fa, 1).setDepth(6)

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.wasd = {
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      }
    }

    this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (this.hasTouch) {
      this.buildTouchControls()
      // Rebuild on resize so buttons reposition correctly after orientation change.
      // On Android the layout settles after Phaser initialises, so the first
      // resize event delivers the definitive dimensions.
      scene.scale.on('resize', this.onResize, this)
    }
  }

  private readonly onResize = () => {
    // Destroy visuals only — keep the resize listener active for future resizes
    this.touchObjs.forEach((o) => o.destroy())
    this.touchObjs = []
    this.buildTouchControls()
  }

  private buildTouchControls() {
    const { width, height } = this.scene.scale
    const R = 26
    const Y = height - 36
    const DEPTH = 30

    const makeBtn = (cx: number, color: number, label: string) => {
      const bg = this.scene.add
        .circle(cx, Y, R, color, 0.40)
        .setScrollFactor(0)
        .setDepth(DEPTH)
        .setInteractive()
      const lbl = this.scene.add
        .text(cx, Y, label, { fontSize: '18px', color: '#ffffff' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
      this.touchObjs.push(bg, lbl)
      return bg
    }

    const leftBtn  = makeBtn(44,         0x4f46e5, '◀')
    const rightBtn = makeBtn(110,        0x4f46e5, '▶')
    const jumpBtn  = makeBtn(width - 50, 0x059669, '▲')

    const bind = (
      btn: Phaser.GameObjects.Arc,
      set: (v: boolean) => void,
    ) => {
      btn.on('pointerdown',  () => set(true))
      btn.on('pointerup',    () => set(false))
      btn.on('pointerout',   () => set(false))
      btn.on('pointercancel',() => set(false))
    }

    bind(leftBtn,  (v) => { this.touchLeft  = v })
    bind(rightBtn, (v) => { this.touchRight = v })
    bind(jumpBtn,  (v) => { this.touchJump  = v })
  }

  destroyTouchControls() {
    this.touchObjs.forEach((o) => o.destroy())
    this.touchObjs = []
    if (this.hasTouch) {
      this.scene.scale.off('resize', this.onResize, this)
    }
  }

  update() {
    // Electron orbit
    this.orbitAngle += 0.045
    this.electron.setPosition(
      this.sprite.x + Math.cos(this.orbitAngle) * 22,
      this.sprite.y + Math.sin(this.orbitAngle) * 10,
    )

    if (!this.isControlEnabled) {
      this.sprite.setVelocityX(0)
      return
    }

    const left = this.cursors?.left.isDown || this.wasd?.left.isDown || this.touchLeft
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown || this.touchRight
    const jumpKey =
      this.cursors?.up.isDown ||
      this.cursors?.space.isDown ||
      this.wasd?.up.isDown ||
      this.touchJump

    if (left) {
      this.sprite.setVelocityX(-SPEED)
      this.sprite.setFlipX(true)
    } else if (right) {
      this.sprite.setVelocityX(SPEED)
      this.sprite.setFlipX(false)
    } else {
      this.sprite.setVelocityX(0)
    }

    if (jumpKey && this.isOnGround()) {
      this.sprite.setVelocityY(JUMP_VY)
    }
  }

  isOnGround(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    return body.blocked.down
  }

  /** Flash red on wrong answer */
  flashHit() {
    this.scene.tweens.add({
      targets: [this.sprite, this.electron],
      alpha: 0,
      duration: 70,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.sprite.setAlpha(1)
        this.electron.setAlpha(1)
      },
    })
    // Slight knockback
    this.sprite.setVelocityX(-120)
  }

  /** Bounce forward on correct answer */
  flashCorrect() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 120,
      yoyo: true,
    })
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite
  }

  get x() { return this.sprite.x }
  get y() { return this.sprite.y }
}
