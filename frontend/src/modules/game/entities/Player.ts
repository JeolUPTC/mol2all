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

    const left = this.cursors?.left.isDown || this.wasd?.left.isDown
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown
    const jumpKey =
      this.cursors?.up.isDown ||
      this.cursors?.space.isDown ||
      this.wasd?.up.isDown

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
