import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private totalOverlap: number
    private totalOverlapDisplay: Phaser.GameObjects.Text
    private color: string
    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        // this.setOrigin(0, 0)
        this.totalOverlap = 0
        this.setDepth(-1)
        this.setInteractive()

        this.scene.add.existing(this)
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

    public addTotalOverlap(number: number) {
        this.totalOverlap = this.totalOverlap + number
        if (this.totalOverlap >= 5) {
            if (!this.totalOverlapDisplay) {
                this.totalOverlapDisplay = this.scene.add
                    .text(this.x, this.y, `${this.totalOverlap}`, {
                        fontSize: '32px',
                        fontFamily: 'Arial',
                        color: '#ff0000',
                    })
                    .setDepth(10)
                    .setOrigin(0.5)
                console.log('hello there')
            } else {
                this.totalOverlapDisplay.setText(`${this.totalOverlap}`)
            }
        }
    }

    public getTotalOverlap() {
        return this.totalOverlap
    }

    public destroy() {
        if (this.totalOverlapDisplay) this.totalOverlapDisplay.destroy()
        super.destroy()
    }

    public updateTotalOverlayDisplay() {
        if (this.totalOverlapDisplay) this.totalOverlapDisplay.setPosition(this.x, this.y)
    }

    public getColor() {
        return this.color
    }
}
