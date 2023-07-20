export class ProgressUI extends Phaser.GameObjects.Container {
    private progressbar: Phaser.GameObjects.Rectangle
    private progressbarFill: Phaser.GameObjects.Rectangle
    private progressbarEmitter: Phaser.GameObjects.Particles.ParticleEmitter
    private scoreDisplay: Phaser.GameObjects.Text
    private levelDisplay: Phaser.GameObjects.Text
    private align = 10
    private maxScore = 10000
    private level = 1

    constructor(scene: Phaser.Scene) {
        super(scene)
        this.init()
    }

    private init() {
        this.scene.add.container(0, 0, this)
        this.setSize(this.scene.sys.canvas.width, 144)
        this.add(this.scene.add.rectangle(0, 0, this.width, this.height, 0x0000ff, 1).setOrigin(0))
        this.setPosition(0, 0)
        this.progressbar = this.scene.add
            .rectangle(this.align, 100, 150, 20, 0xffffff)
            .setOrigin(0)
            .setDepth(1)

        this.progressbarFill = this.scene.add
            .rectangle(this.align, 100, 0, 20, 0x41d8f2)
            .setOrigin(0)
            .setDepth(1)
        this.scoreDisplay = this.scene.add
            .text(this.scene.sys.canvas.width / 2, this.progressbar.y - 20, `0`, {
                fontSize: '48px',
                fontFamily: 'Arial',
                color: '#ffffff',
            })
            .setOrigin(0.5, 0)
        this.progressbarEmitter = this.scene.add.particles(
            this.align,
            this.progressbarFill.y + this.progressbarFill.height / 2,
            'flares',
            {
                frame: ['white'],
                lifespan: 500,
                speed: { min: 50, max: 100 },
                scale: { start: 0.1, end: 0 },
                gravityY: 0,
                blendMode: 'ADD',
                emitting: true,
                gravityX: -1000,
            }
        )
        this.levelDisplay = this.scene.add
            .text(10, 100, 'Level 1', {
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'Arial',
            })
            .setOrigin(0, 1)
        this.add([this.progressbar, this.progressbarFill, this.levelDisplay])
    }

    public updateProgreebar(percentage: number) {
        this.scene.add.tween({
            targets: this.progressbarFill,
            duration: 1000,
            width: (percentage / this.maxScore) * 150,
            repeat: 0,
        })

        if (percentage == 0) {
            this.progressbarEmitter.gravityX = 1000
        }

        this.scene.add.tween({
            targets: this.progressbarEmitter,
            duration: 1000,
            x: (percentage / this.maxScore) * 150 + this.align,
            repeat: 0,
            onComplete: () => {
                this.progressbarEmitter.gravityX = -1000
            },
        })
    }

    public updateScore(prevScore: number, currentScore: number) {
        this.scene.tweens.addCounter({
            from: prevScore,
            to: currentScore,
            duration: 1000,
            ease: 'linear',
            onUpdate: (tween) => {
                this.scoreDisplay.setText(`${Math.round(tween.getValue())}`)
            },
        })

        this.scene.add.tween({
            targets: this.scoreDisplay,
            scale: 1.2,
            yoyo: true,
            duration: 500,
        })
    }

    public levelUp() {
        this.level++
        this.maxScore += 2000
        this.levelDisplay.setText(`Level ${this.level}`)
    }

    public getMaxScore() {
        return this.maxScore
    }

    public getLevel() {
        return this.level
    }
}
