export class Progressbar extends Phaser.GameObjects.Container {
    private progressbar: Phaser.GameObjects.Rectangle
    private progressbarFill: Phaser.GameObjects.Rectangle
    private progressbarEmitter: Phaser.GameObjects.Particles.ParticleEmitter
    private scoreDisplay: Phaser.GameObjects.Text
    private hintButton: Phaser.GameObjects.Text
    constructor(scene: Phaser.Scene) {
        super(scene)
    }

    init() {
        this.scene.add.container(0, 0, this)
        this.setSize(this.scene.sys.canvas.width, 144)
        this.add(this.scene.add.rectangle(0, 0, this.width, this.height, 0x0000ff, 1).setOrigin(0))
        this.setPosition(0, 0)
        this.progressbar = this.scene.add
            .rectangle(10, 100, 150, 20, 0xffffff)
            .setOrigin(0)
            .setDepth(1)
        this.progressbarFill = this.scene.add
            .rectangle(10, 100, 0, 20, 0x41d8f2)
            .setOrigin(0)
            .setDepth(1)
        this.scoreDisplay = this.scene.add
            .text(this.scene.sys.canvas.width / 2, this.progressbar.y - 32, `0`, {
                fontSize: '64px',
                fontFamily: 'Arial',
                color: '#ffffff',
            })
            .setOrigin(0.5, 0)
        this.progressbarEmitter = this.scene.add.particles(
            10,
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
        this.add([this.progressbar, this.progressbarFill])
    }

    updateProgreebar(percentage: number) {
        this.scene.add.tween({
            targets: this.progressbarFill,
            duration: 1000,
            width: (percentage / 3000) * 150,
            repeat: 0,
        })

        if (percentage == 0) {
            this.progressbarEmitter.gravityX = 1000
        }

        this.scene.add.tween({
            targets: this.progressbarEmitter,
            duration: 1000,
            x: (percentage / 3000) * 150 + 10,
            repeat: 0,
            onComplete: () => {
                this.progressbarEmitter.gravityX = -1000
            },
        })
    }

    updateScore(prevScore: number, currentScore: number) {
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
}
