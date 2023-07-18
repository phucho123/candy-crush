import { CONST } from '../const/const'

export class Confetti extends Phaser.GameObjects.Image {
    body: Phaser.Physics.Arcade.Body
    private sizeX = 1
    private scaleDir = -1
    private dir = -1
    private colors = ['red', 'green', 'yellow', 'blue']
    private delta: number

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, '')
        console.log('Create new confitti')
        this.delta = 1

        this.setTexture(this.colors[Phaser.Math.Between(0, 3)])

        // this.speed = Phaser.Math.GetSpeed(400, 1)

        // this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.body.setAllowGravity(true)

        const scale = Phaser.Math.Between(1, 5) * 0.1

        this.setScale(scale).setDepth(1)
        this.body.setMass(1)
    }

    fire(dir: number) {
        this.setAlpha(1)
        this.dir = dir
        if (this.dir == 1) {
            this.setPosition(
                Phaser.Math.Between(-300, 0),
                Phaser.Math.Between(
                    this.scene.sys.canvas.height / 2 - 100,
                    this.scene.sys.canvas.height / 2 + 200
                )
            )
        } else {
            this.setPosition(
                Phaser.Math.Between(this.scene.sys.canvas.width, this.scene.sys.canvas.width + 300),
                Phaser.Math.Between(
                    this.scene.sys.canvas.height / 2 - 100,
                    this.scene.sys.canvas.height / 2 + 200
                )
            )
        }

        this.body.setAcceleration(this.dir * 200, -200)
        this.body.setVelocity(
            this.dir * Phaser.Math.Between(500, 600),
            -Phaser.Math.Between(500, 600)
        )
        this.setActive(true)
        this.setVisible(true)
        this.rotation = (Phaser.Math.Between(1, 20) * Math.PI) / 10
        this.sizeX = Phaser.Math.Between(1, 9) / 10
    }

    update(time: number, delta: number) {
        this.delta = delta / CONST.delta
        this.sizeX += this.scaleDir * 0.03 * this.delta
        if (this.sizeX <= 0 && this.scaleDir < 0) {
            this.sizeX = 0
            this.scaleDir = 1
        } else if (this.sizeX >= 1 && this.scaleDir > 0) {
            this.sizeX = 1
            this.scaleDir = -1
        }

        this.setRotation(0.007 * this.delta + this.rotation)
        this.scaleX = this.sizeX * this.scale
        // F_x = 0.5 * ρ * A * Cd * v²_x
        // F_y = 0.5 * ρ * A * Cd * v²_y
        const c = -this.dir * 0.0035
        const a_x = (0.5 * c * Math.pow(this.body.velocity.x, 2)) / 1
        const a_y = -(0.5 * Math.abs(c) * Math.pow(this.body.velocity.y, 2)) / 1

        if (
            this.body.acceleration.x * this.dir < 0 &&
            (this.body.velocity.x + this.body.acceleration.x) * this.dir <= 0
        ) {
            this.body.setAccelerationX(0)
            this.body.setVelocityX(this.dir * 50)
        } else if (this.body.acceleration.x * this.dir > 0) {
            this.body.setAccelerationX(this.body.acceleration.x + a_x)
        } else if (this.body.acceleration.x == 0) {
            this.alpha = Math.max(this.alpha - 0.005, 0)
        }

        this.body.setAccelerationY(Math.max(0, this.body.acceleration.y + a_y))

        if (this.y > this.scene.sys.canvas.height || this.alpha <= 0) {
            this.setActive(false)
        }
    }
}
