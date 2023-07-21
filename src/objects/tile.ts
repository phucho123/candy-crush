import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private color: string
    private matches4Tween: Phaser.Tweens.Tween
    private matches5Tween: Phaser.Tweens.Tween
    private overlap: number
    private matches5EffectImage: Phaser.GameObjects.Image
    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        this.overlap = 0
        this.setDepth(-1)
        this.setInteractive()

        this.setColor()
        this.matches5EffectImage = this.scene.add
            .image(this.x, this.y, 'shockWave')
            .setVisible(false)
            .setDepth(-0.5)
            .setTint(0xff0000)

        this.scene.add.existing(this)
    }

    public setOverlap(overlap: number): void {
        this.overlap = overlap
        if (this.overlap >= 4) {
            if (!this.matches4Tween || this.matches4Tween.isDestroyed())
                this.matches4Tween = this.scene.add.tween({
                    targets: this,
                    duration: 500,
                    yoyo: true,
                    scale: 0.7,
                    repeat: -1,
                    ease: 'sine.inout',
                })
        }

        if (this.overlap >= 5) {
            this.setTexture('bomb')
            if (!this.matches5Tween || this.matches5Tween.isDestroyed()) {
                this.matches5EffectImage.setVisible(true)
                this.matches5EffectImage.setAlpha(1).setScale(0)
                this.matches5Tween = this.scene.add.tween({
                    targets: this.matches5EffectImage,
                    scale: 3,
                    alpha: 0,
                    yoyo: false,
                    duration: 1000,
                    repeat: -1,
                    onUpdate: () => {
                        this.matches5EffectImage.setPosition(this.x, this.y)
                    },
                })
            }
        }
    }

    public getOverlap(): number {
        return this.overlap
    }

    public destroy(): void {
        this.setActive(false)
        this.setVisible(false)
        this.overlap = 0

        if (this.matches4Tween) {
            this.matches4Tween.destroy()
        }
        if (this.matches5Tween) {
            this.matches5EffectImage.setVisible(false)
            this.matches5Tween.destroy()
        }
    }

    public isDestroyed(): boolean {
        return !this.active
    }

    public getColor(): string {
        return this.color
    }

    public setColor(): void {
        this.color = 'white'
        switch (this.texture.key) {
            case 'cookie1':
                this.color = 'yellow'
                break
            case 'cookie2':
                this.color = 'yellow'
                break
            case 'croissant':
                this.color = 'yellow'
                break
            case 'cupcake':
                this.color = 'red'
                break
            case 'donut':
                this.color = 'red'
                break
            case 'eclair':
                this.color = 'white'
                break
            case 'macaroon':
                this.color = 'green'
                break
            case 'pie':
                this.color = 'yellow'
                break
            case 'poptart1':
                this.color = 'blue'
                break
            case 'poptart2':
                this.color = 'white'
                break
            case 'starcookie1':
                this.color = 'yellow'
                break
            case 'startcookie2':
                this.color = 'white'
                break
            default:
                break
        }
    }
}
