import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter
    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        // set image settings
        // this.setOrigin(0, 0)
        this.setDepth(0)
        this.setInteractive()

        this.scene.add.existing(this)
        let color = 'white'
        switch (this.texture.key) {
            case 'cookie1':
                color = 'yellow'
                break
            case 'cookie2':
                color = 'yellow'
                break
            case 'croissant':
                color = 'yellow'
                break
            case 'cupcake':
                color = 'red'
                break
            case 'donut':
                color = 'red'
                break
            case 'eclair':
                color = 'white'
                break
            case 'macaroon':
                color = 'green'
                break
            case 'pie':
                color = 'yellow'
                break
            case 'poptart1':
                color = 'blue'
                break
            case 'poptart2':
                color = 'white'
                break
            case 'starcookie1':
                color = 'yellow'
                break
            case 'startcookie2':
                color = 'white'
                break
            default:
                break
        }
        this.emitter = this.scene.add.particles(this.x, this.y, 'flares', {
            frame: [color],
            lifespan: 500,
            speed: { min: 100, max: 150 },
            scale: { start: 0.8, end: 0 },
            gravityY: 0,
            blendMode: 'ADD',
            emitting: false,
        })
    }

    public explode(): void {
        this.emitter.explode(32)
    }

    public updateEmitterPosition() {
        this.emitter.setPosition(this.x, this.y)
    }
}
