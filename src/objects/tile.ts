import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    // private totalOverlapDisplay: Phaser.GameObjects.Text
    private color: string
    private matches4Tween: Phaser.Tweens.Tween
    private matches5Tween: Phaser.Tweens.Tween
    private overlap: number
    private fx: Phaser.FX.Glow
    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        this.overlap = 0
        this.setDepth(-1)
        this.setInteractive()

        this.setColor()

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
            if (this.preFX) {
                this.preFX.setPadding(50)
                this.fx = this.preFX.addGlow()
                if (!this.matches5Tween || this.matches5Tween.isDestroyed())
                    this.matches5Tween = this.scene.tweens.add({
                        targets: this.fx,
                        outerStrength: 20,
                        yoyo: true,
                        loop: -1,
                        ease: 'sine.inout',
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
        if (this.matches4Tween) this.matches4Tween.destroy()
        if (this.matches5Tween) {
            this.fx.destroy()
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
